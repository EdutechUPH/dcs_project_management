// src/lib/reports/metrics.ts
//
// One implementation of every figure the app reports, so a report can never contradict
// the dashboard it was generated from.
//
// The rules encoded here are the ones AI_README treats as load-bearing. They are stated
// once, here, rather than re-derived per surface:
//
//   §8  Editing credit is per VIDEO (`videos.main_editor_id`), never per project
//       assignment. Sound engineers have no per-video credit and are credited for every
//       completed video in the projects they are assigned to — their minutes therefore
//       OVERLAP the editors' rather than adding to them, and the two must never be summed.
//   §9  A project is complete when its status is 'Done' OR a feedback form exists.
//       Active workload excludes Pending/Cancelled projects and Done videos.
//   §11 A video's deadline is its own `due_date`, else the project's. Delivery is the
//       FIRST hand-off (`delivered_at`), which is NULL for everything predating July 2026
//       and must be reported as "not tracked" rather than assumed punctual.
//   §15 "Completed" means the lecturer approved it. "Delivered" means it first reached
//       the lecturer. They are different populations and are never used as synonyms.

import { endOfDay, parseISO } from 'date-fns';
import { deadlineFor } from '@/lib/dates';

// ---------------------------------------------------------------------------
// Row shapes — the minimum each calculation needs, so callers can select narrowly
// ---------------------------------------------------------------------------

export interface MetricVideo {
    id?: number | null;
    status: string;
    duration_minutes?: number | null;
    duration_seconds?: number | null;
    main_editor_id?: string | null;
    due_date?: string | null;
    delivered_at?: string | null;
    video_link?: string | null;
    has_english_subtitle?: boolean | null;
    has_indonesian_subtitle?: boolean | null;
}

export interface MetricProject {
    id: number;
    course_name?: string | null;
    status?: string | null;
    due_date?: string | null;
    term_id?: number | string | null;
    faculty_id?: number | string | null;
    faculties?: { name?: string | null } | null;
    prodi?: { name?: string | null } | null;
    lecturers?: { name?: string | null } | null;
    terms?: { name?: string | null } | null;
    videos?: MetricVideo[] | null;
    project_assignments?: { profile_id: string; role: string }[] | null;
    feedback_submission?: FeedbackRow | FeedbackRow[] | null;
}

export interface FeedbackRow {
    submitted_at?: string | null;
    rating_final_product?: number | null;
    rating_pre_production?: number | null;
    rating_communication?: number | null;
    rating_quality?: number | null;
    rating_timeliness?: number | null;
}

// ---------------------------------------------------------------------------
// The three state rules (§9)
// ---------------------------------------------------------------------------

/** PostgREST returns a one-to-one embed as an object, but has historically returned an array. */
export function firstFeedback(project: MetricProject): FeedbackRow | null {
    const fb = project.feedback_submission;
    if (!fb) return null;
    return Array.isArray(fb) ? fb[0] ?? null : fb;
}

/** §9 — 'Done', or a feedback form has been submitted. */
export function isProjectCompleted(project: MetricProject): boolean {
    return project.status === 'Done' || Boolean(firstFeedback(project)?.submitted_at);
}

/** Pending or Cancelled — real work that is not in production. */
export function isProjectParked(project: MetricProject): boolean {
    return !isProjectCompleted(project) && ['Pending', 'Cancelled'].includes(project.status || 'Active');
}

/** Neither completed nor parked: work actually moving. */
export function isProjectOngoing(project: MetricProject): boolean {
    return !isProjectCompleted(project) && !isProjectParked(project);
}

/** §15 — a video the lecturer has approved. */
export const isVideoCompleted = (video: MetricVideo) => video.status === 'Done';

/** §15 — not yet completed, in a project that is neither parked nor finished. */
export function isVideoInProduction(video: MetricVideo, project: MetricProject): boolean {
    return !isVideoCompleted(video) && !isProjectParked(project) && !isProjectCompleted(project);
}

/** Minutes, from the two columns videos store them in. */
export function runtimeMinutes(video: MetricVideo): number {
    return (video.duration_minutes ?? 0) + (video.duration_seconds ?? 0) / 60;
}

// ---------------------------------------------------------------------------
// Punctuality (§11)
// ---------------------------------------------------------------------------

export type Punctuality = 'on-time' | 'late' | 'not-tracked';

/**
 * Whether a video reached the lecturer by its deadline.
 *
 * `not-tracked` when there is no delivery date or no deadline — never guessed. Reporting
 * an undated hand-off as on time is how an earlier version of the analytics produced a
 * confident 11% team punctuality figure that meant nothing.
 */
export function punctuality(video: MetricVideo, project: MetricProject): Punctuality {
    const deadline = deadlineFor(video, project);
    if (!video.delivered_at || !deadline) return 'not-tracked';

    // A deadline counts as met through the END of that day. Comparing date strings would
    // be simpler and wrong: `delivered_at` is a TIMESTAMPTZ, so a hand-off at 23:00 local
    // on the deadline day can already carry the next day's UTC date and would be recorded
    // as late. This is the analytics page's original comparison, kept because it is the
    // more careful of the two.
    return parseISO(video.delivered_at).getTime() <= endOfDay(parseISO(deadline)).getTime()
        ? 'on-time'
        : 'late';
}

export interface PunctualitySummary {
    onTime: number;
    late: number;
    notTracked: number;
    /** Percentage of MEASURABLE deliveries that were on time. Null when none are. */
    rate: number | null;
}

export function summarisePunctuality(
    pairs: { video: MetricVideo; project: MetricProject }[],
): PunctualitySummary {
    let onTime = 0, late = 0, notTracked = 0;
    for (const { video, project } of pairs) {
        const p = punctuality(video, project);
        if (p === 'on-time') onTime++;
        else if (p === 'late') late++;
        else notTracked++;
    }
    const measurable = onTime + late;
    return { onTime, late, notTracked, rate: measurable > 0 ? (onTime / measurable) * 100 : null };
}

// ---------------------------------------------------------------------------
// Per-member credit (§8)
// ---------------------------------------------------------------------------

export interface EditorCredit {
    completedVideos: number;
    videosInProduction: number;
    /** Minutes of COMPLETED video only — work in production has no final runtime. */
    minutesCompleted: number;
    punctuality: PunctualitySummary;
    /**
     * Distinct projects this person is credited on, most videos first.
     *
     * `completed + inProduction` does NOT have to equal `credited`: a video in a Pending or
     * Cancelled project is neither. Keeping the three separate is what lets a bar chart
     * show completed and in-production segments whose totals match the headline figures,
     * with parked work visible as the gap rather than silently folded into either.
     */
    projects: {
        project: MetricProject;
        credited: number;
        completed: number;
        inProduction: number;
    }[];
    faculties: string[];
}

/**
 * What one editor is credited with, read strictly from `videos.main_editor_id`.
 *
 * Deliberately ignores `project_assignments`: a project's Main Editor only seeds the
 * default on each video, and a per-video override moves the credit with it (§8). Using
 * the assignment here would credit an editor for videos somebody else actually cut.
 */
export function editorCredit(projects: MetricProject[], profileId: string): EditorCredit {
    const pairs: { video: MetricVideo; project: MetricProject }[] = [];
    const byProject = new Map<
        number,
        { project: MetricProject; credited: number; completed: number; inProduction: number }
    >();
    const faculties = new Set<string>();

    for (const project of projects) {
        for (const video of project.videos ?? []) {
            if (video.main_editor_id !== profileId) continue;
            pairs.push({ video, project });

            const row = byProject.get(project.id)
                ?? { project, credited: 0, completed: 0, inProduction: 0 };
            row.credited++;
            if (isVideoCompleted(video)) row.completed++;
            else if (isVideoInProduction(video, project)) row.inProduction++;
            byProject.set(project.id, row);

            const faculty = project.faculties?.name;
            if (faculty) faculties.add(faculty);
        }
    }

    const completed = pairs.filter(p => isVideoCompleted(p.video));

    return {
        completedVideos: completed.length,
        videosInProduction: pairs.filter(p => isVideoInProduction(p.video, p.project)).length,
        minutesCompleted: completed.reduce((sum, p) => sum + runtimeMinutes(p.video), 0),
        // Punctuality is measured on delivered work, so completed videos are the population.
        punctuality: summarisePunctuality(completed),
        projects: [...byProject.values()].sort((a, b) => b.credited - a.credited),
        faculties: [...faculties].sort(),
    };
}

export interface ProjectRoleCredit {
    projects: { project: MetricProject; completed: number; inProduction: number }[];
    completedVideos: number;
    videosInProduction: number;
    minutesCompleted: number;
    faculties: string[];
}

/**
 * What someone assigned to a PROJECT is credited with — sound engineers, instructional
 * designers, assistants.
 *
 * These roles have no per-video column, so credit is project-wide: every video in a
 * project they are assigned to. That means these minutes overlap the editors' rather
 * than adding to them — the same video is counted for both roles — and a team total must
 * never sum the two (§8).
 */
export function projectRoleCredit(
    projects: MetricProject[],
    profileId: string,
    /**
     * One role, or several treated as one.
     *
     * Several is not the same as adding up the single-role results: somebody who is both
     * Assistant Editor and Assistant Videographer on the same project would have that
     * project — and every video in it — counted twice. Taking the union of the projects
     * first is the only way "assistant editors and videographers" can be one figure.
     */
    role: string | string[],
): ProjectRoleCredit {
    const roles = Array.isArray(role) ? role : [role];
    const rows: { project: MetricProject; completed: number; inProduction: number }[] = [];
    const faculties = new Set<string>();
    let completedVideos = 0, videosInProduction = 0, minutesCompleted = 0;

    for (const project of projects) {
        const assigned = (project.project_assignments ?? [])
            .some(a => a.profile_id === profileId && roles.includes(a.role));
        if (!assigned) continue;

        let completed = 0, inProduction = 0;
        for (const video of project.videos ?? []) {
            if (isVideoCompleted(video)) {
                completed++;
                minutesCompleted += runtimeMinutes(video);
            } else if (isVideoInProduction(video, project)) {
                inProduction++;
            }
        }
        completedVideos += completed;
        videosInProduction += inProduction;
        rows.push({ project, completed, inProduction });

        const faculty = project.faculties?.name;
        if (faculty) faculties.add(faculty);
    }

    return {
        projects: rows.sort((a, b) => (b.completed + b.inProduction) - (a.completed + a.inProduction)),
        completedVideos,
        videosInProduction,
        minutesCompleted,
        faculties: [...faculties].sort(),
    };
}

// ---------------------------------------------------------------------------
// Completeness — the two senses, kept separate on purpose
// ---------------------------------------------------------------------------

export interface DeliverableCompleteness {
    projects: number;
    fullyDelivered: number;
    withEnglishSubtitles: number;
    withIndonesianSubtitles: number;
    withLink: number;
    completedVideos: number;
}

/**
 * What actually reached the lecturer: did every promised video ship, with its subtitles
 * and its link. About the product, and the half of the completeness story a boss cares
 * about.
 */
export function deliverableCompleteness(projects: MetricProject[]): DeliverableCompleteness {
    let fullyDelivered = 0, en = 0, id = 0, link = 0, completedVideos = 0;

    for (const project of projects) {
        const videos = project.videos ?? [];
        if (videos.length > 0 && videos.every(isVideoCompleted)) fullyDelivered++;
        for (const video of videos) {
            if (!isVideoCompleted(video)) continue;
            completedVideos++;
            if (video.has_english_subtitle) en++;
            if (video.has_indonesian_subtitle) id++;
            if (video.video_link) link++;
        }
    }

    return {
        projects: projects.length,
        fullyDelivered,
        withEnglishSubtitles: en,
        withIndonesianSubtitles: id,
        withLink: link,
        completedVideos,
    };
}

export interface TrackerCompleteness {
    videos: number;
    withEditor: number;
    withDuration: number;
    withDeliveryDate: number;
    withOwnDeadline: number;
}

/**
 * How well the tracker itself is filled in — the half of the story the TEAM acts on.
 *
 * Reported because every gap here silently weakens a figure elsewhere: a video with no
 * duration is missing from runtime totals, one with no editor is credited to nobody, and
 * one with no delivery date cannot be counted on time or late.
 */
export function trackerCompleteness(projects: MetricProject[]): TrackerCompleteness {
    return videoCompleteness(projects.flatMap(project => project.videos ?? []));
}

/**
 * The same measure over an arbitrary set of videos.
 *
 * Exists so a member's report can grade the record of THEIR OWN work — the videos they are
 * credited on — using the identical rules as the team sheet. A per-person completeness
 * figure computed a second way would be the first thing anyone disputed.
 */
export function videoCompleteness(videos: MetricVideo[]): TrackerCompleteness {
    let withEditor = 0, withDuration = 0, withDeliveryDate = 0, withOwnDeadline = 0;

    for (const video of videos) {
        if (video.main_editor_id) withEditor++;
        // Both columns, because a 45-second clip has no whole minutes and would otherwise
        // read as having no duration recorded at all.
        if (video.duration_minutes || video.duration_seconds) withDuration++;
        if (video.delivered_at) withDeliveryDate++;
        if (video.due_date) withOwnDeadline++;
    }

    return { videos: videos.length, withEditor, withDuration, withDeliveryDate, withOwnDeadline };
}

// ---------------------------------------------------------------------------
// Satisfaction (project-level — the form is submitted once per finished project)
// ---------------------------------------------------------------------------

export interface SatisfactionCategory {
    label: string;
    /** Mean of the ratings given. Null when nobody rated it — never a zero score. */
    score: number | null;
    /**
     * How many forms actually rated THIS category.
     *
     * Not the same as `responses`: a lecturer can submit the form and leave a category
     * blank, and a 5.0 from one rating means something very different from a 5.0 from
     * fifteen. Reported per row so the reader can tell those apart.
     */
    count: number;
    /** The spread behind the mean. Null when nothing was rated. */
    lowest: number | null;
    highest: number | null;
}

export interface SatisfactionSummary {
    /** Forms submitted, i.e. projects rated. */
    responses: number;
    /** Projects that could have been rated, so `responses` has a denominator. */
    projects: number;
    /** Null when nothing has been rated — never rendered as a zero score. */
    finalProduct: number | null;
    /**
     * Mean of the category means, weighting each category equally.
     *
     * Not a mean over every individual rating: that would silently weight whichever
     * category lecturers happen to fill in most often.
     */
    overall: number | null;
    categories: SatisfactionCategory[];
}

export function satisfaction(projects: MetricProject[]): SatisfactionSummary {
    const rows = projects.map(firstFeedback).filter((f): f is FeedbackRow => Boolean(f?.submitted_at));

    const summarise = (
        label: string,
        pick: (f: FeedbackRow) => number | null | undefined,
    ): SatisfactionCategory => {
        // `> 0` filters out both nulls and the zeroes an unanswered question can store,
        // which would otherwise drag a mean down as though the lecturer had scored it.
        const values = rows.map(pick).filter((v): v is number => typeof v === 'number' && v > 0);
        return {
            label,
            score: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
            count: values.length,
            lowest: values.length > 0 ? Math.min(...values) : null,
            highest: values.length > 0 ? Math.max(...values) : null,
        };
    };

    const categories = [
        summarise('Pre-production', f => f.rating_pre_production),
        summarise('Communication', f => f.rating_communication),
        summarise('Quality', f => f.rating_quality),
        summarise('Timeliness', f => f.rating_timeliness),
        summarise('Final product', f => f.rating_final_product),
    ];

    const scored = categories.map(c => c.score).filter((s): s is number => s != null);

    return {
        responses: rows.length,
        projects: projects.length,
        finalProduct: categories.find(c => c.label === 'Final product')?.score ?? null,
        overall: scored.length > 0 ? scored.reduce((a, b) => a + b, 0) / scored.length : null,
        categories,
    };
}
