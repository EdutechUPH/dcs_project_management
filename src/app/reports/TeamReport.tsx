// src/app/reports/TeamReport.tsx
//
// The whole team's report, across three sheets: what was delivered, who delivered it, and
// how good the record of it is.
//
// Three explicit `report-page` articles rather than one long flow. The sections have a
// natural grouping and a reader picking the report up mid-way should land on a sheet that
// announces what it is, not halfway down a table that started two pages ago.
//
// The one arithmetic rule this file exists to respect: editing credit and project-role
// credit describe the SAME videos from two angles (AI_README §8). They are never summed.
// Section 2 keeps them in separate tables for that reason, and says so on the page.
'use client';

import {
    deliverableCompleteness,
    editorCredit,
    firstFeedback,
    isProjectCompleted,
    isProjectOngoing,
    isProjectParked,
    isVideoCompleted,
    isVideoInProduction,
    projectRoleCredit,
    runtimeMinutes,
    satisfaction,
    summarisePunctuality,
    trackerCompleteness,
    type MetricProject,
    type MetricVideo,
} from '@/lib/reports/metrics';
import { roleTheme } from '@/lib/roles';
import { formatMinutes } from '@/components/insight/tokens';
import {
    DONE_COLOUR,
    IN_PRODUCTION_COLOUR,
    PARKED_COLOUR,
    CoverageRow,
    FacultySplit,
    Figure,
    Footer,
    Masthead,
    Rating,
    SectionRule,
    SectionTitle,
    Swatch,
    buildFacultyColours,
    facultySplit,
} from './parts';

export type TeamMember = {
    id: string;
    full_name: string;
    role: string | null;
    projectRoles: string[];
};

type Props = {
    projects: MetricProject[];
    members: TeamMember[];
    termNames: string[];
    generatedAt: string;
};

/** Project roles reported separately. Editing is per-video and reported on its own (§8). */
const PROJECT_ROLES = [
    'Sound Engineer',
    'Instructional Designer',
    'Assistant Editor',
    'Assistant Videographer',
] as const;

const sheet = 'report-page flex flex-col p-[13mm] text-[10pt] text-gray-900 shadow-lg print:shadow-none';

export default function TeamReport({ projects, members, termNames, generatedAt }: Props) {
    // -----------------------------------------------------------------------
    // Populations
    // -----------------------------------------------------------------------
    const completedProjects = projects.filter(isProjectCompleted);
    const ongoingProjects = projects.filter(isProjectOngoing);
    const parkedProjects = projects.filter(isProjectParked);

    const allVideos: { video: MetricVideo; project: MetricProject }[] = projects.flatMap(
        project => (project.videos ?? []).map(video => ({ video, project })),
    );
    const completedVideos = allVideos.filter(v => isVideoCompleted(v.video));
    const inProductionVideos = allVideos.filter(v => isVideoInProduction(v.video, v.project));
    const totalMinutes = completedVideos.reduce((sum, v) => sum + runtimeMinutes(v.video), 0);
    const punctuality = summarisePunctuality(completedVideos);

    // Completed videos carrying no duration at all. The runtime headline is a sum over the
    // ones that do, so a gap here means the figure is an undercount — and a runtime total
    // that silently understates itself is worse than no runtime total, because a reader
    // will compare it against next year's.
    const missingDuration = completedVideos.filter(
        v => !v.video.duration_minutes && !v.video.duration_seconds,
    ).length;
    const measuredVideos = completedVideos.length - missingDuration;

    const facultyColour = buildFacultyColours(projects);
    const faculties = facultySplit(
        projects.map(project => ({ project, videos: (project.videos ?? []).length })),
        facultyColour,
    );

    // -----------------------------------------------------------------------
    // People
    // -----------------------------------------------------------------------
    const editors = members
        .map(member => ({ member, credit: editorCredit(projects, member.id) }))
        .filter(row => row.credit.completedVideos > 0 || row.credit.videosInProduction > 0)
        .sort((a, b) => b.credit.completedVideos - a.credit.completedVideos);

    const editorVideoTotal = editors.reduce((s, e) => s + e.credit.completedVideos, 0);
    const editorMinuteTotal = editors.reduce((s, e) => s + e.credit.minutesCompleted, 0);
    // Completed videos with nobody named on them. Called out rather than quietly absorbed:
    // it is the difference between the headline figure and what the editors table adds to.
    const unattributed = completedVideos.length - editorVideoTotal;

    const roleRows = PROJECT_ROLES.flatMap(role =>
        members
            .filter(member => member.projectRoles.includes(role))
            .map(member => ({ role, member, credit: projectRoleCredit(projects, member.id, role) }))
            .filter(row => row.credit.projects.length > 0),
    ).sort((a, b) => b.credit.projects.length - a.credit.projects.length);

    // -----------------------------------------------------------------------
    // Quality and record-keeping
    // -----------------------------------------------------------------------
    const scores = satisfaction(projects);
    const deliverable = deliverableCompleteness(projects);
    const tracker = trackerCompleteness(projects);
    const ratedProjects = projects.filter(p => firstFeedback(p)?.submitted_at).length;

    return (
        <>
            {/* ============================ SHEET 1 ============================ */}
            <article className={sheet}>
                <Masthead
                    kicker="Team report"
                    title="Digital Content Services"
                    chip={`${projects.length} projects`}
                    terms={termNames}
                    generatedAt={generatedAt}
                />

                <div className="mt-7 flex-1 space-y-7">
                    <SectionRule>The year in figures</SectionRule>

                    <section className="report-block grid grid-cols-3 gap-2.5">
                        <Figure value={String(completedVideos.length)} label="videos completed" lead />
                        <Figure value={formatMinutes(totalMinutes)} label="runtime delivered" lead />
                        <Figure value={String(completedProjects.length)} label="projects completed" lead />
                        <Figure value={String(inProductionVideos.length)} label="videos in production" />
                        <Figure
                            value={measuredVideos > 0
                                ? `${(totalMinutes / measuredVideos).toFixed(1)}m`
                                : '—'}
                            label="average video length"
                        />
                        <Figure value={String(faculties.length)} label="faculties served" />
                    </section>

                    {missingDuration > 0 && (
                        <p className="report-block -mt-4 text-[7.5pt] leading-relaxed text-gray-500">
                            Runtime covers the {measuredVideos} completed videos that have a duration
                            recorded. {missingDuration} {missingDuration === 1 ? 'does' : 'do'} not, so the
                            true figure is higher — sheet 3 tracks how much of that gap is closing.
                        </p>
                    )}

                    <section className="report-block rounded border border-gray-200 px-4 py-3">
                        <SectionTitle>Where the projects stand</SectionTitle>
                        <StatusBar
                            segments={[
                                { label: 'Completed', count: completedProjects.length, colour: DONE_COLOUR },
                                { label: 'In production', count: ongoingProjects.length, colour: IN_PRODUCTION_COLOUR },
                                { label: 'Pending or cancelled', count: parkedProjects.length, colour: PARKED_COLOUR },
                            ]}
                            total={projects.length}
                            unit="projects"
                        />
                        <div className="mt-4">
                            <SectionTitle>Where the videos stand</SectionTitle>
                            <StatusBar
                                segments={[
                                    { label: 'Completed', count: completedVideos.length, colour: DONE_COLOUR },
                                    { label: 'In production', count: inProductionVideos.length, colour: IN_PRODUCTION_COLOUR },
                                    {
                                        label: 'Pending or cancelled',
                                        count: allVideos.length - completedVideos.length - inProductionVideos.length,
                                        colour: PARKED_COLOUR,
                                    },
                                ]}
                                total={allVideos.length}
                                unit="videos"
                            />
                        </div>
                    </section>

                    <section className="report-block">
                        <SectionTitle>Faculties served</SectionTitle>
                        <FacultySplit split={faculties} />
                    </section>

                    <section className="report-block rounded border border-gray-200 px-4 py-2.5 text-[8.5pt]">
                        <span className="font-semibold">On-time delivery: </span>
                        {punctuality.rate != null ? (
                            <span>
                                {punctuality.rate.toFixed(0)}% — {punctuality.onTime} on time,{' '}
                                {punctuality.late} late
                                {punctuality.notTracked > 0 && `, ${punctuality.notTracked} not tracked`}
                            </span>
                        ) : (
                            <span className="text-gray-600">
                                not measurable for these terms. Delivery dates are recorded from July 2026,
                                so nothing completed before then can be counted on time or late — and is
                                not counted as either.
                            </span>
                        )}
                    </section>
                </div>

                <Footer>Sheet 1 of 3 · Delivery</Footer>
            </article>

            {/* ============================ SHEET 2 ============================ */}
            <article className={sheet}>
                <Masthead
                    kicker="Team report · People"
                    title="Who did the work"
                    chip={`${members.length} people`}
                    terms={termNames}
                    generatedAt={generatedAt}
                />

                <div className="mt-7 flex-1 space-y-7">
                    <SectionRule>Editing</SectionRule>

                    <section>
                        <div className="flex items-baseline justify-between">
                            <SectionTitle keepWithNext>By editor, most videos first</SectionTitle>
                            <span className="text-[8pt] text-gray-500">
                                {editorVideoTotal} videos · {formatMinutes(editorMinuteTotal)}
                            </span>
                        </div>
                        <ul className="mt-3 space-y-2.5">
                            {editors.map(({ member, credit }) => (
                                <li key={member.id} className="report-row grid grid-cols-[1fr_auto] items-center gap-x-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-[9.5pt] leading-snug">{member.full_name}</p>
                                        <p className="truncate text-[7.5pt] leading-snug text-gray-500">
                                            {formatMinutes(credit.minutesCompleted)} ·{' '}
                                            {credit.projects.length} projects
                                            {credit.videosInProduction > 0 &&
                                                ` · ${credit.videosInProduction} in production`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-3 w-[46mm] overflow-hidden rounded-sm bg-gray-100">
                                            <div
                                                style={{
                                                    width: `${(credit.completedVideos / Math.max(1, editors[0].credit.completedVideos)) * 100}%`,
                                                    background: DONE_COLOUR,
                                                }}
                                            />
                                        </div>
                                        <span className="w-10 text-right text-[8.5pt] font-semibold tabular-nums">
                                            {credit.completedVideos}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {unattributed > 0 && (
                            // Stated rather than absorbed: without this the table appears to
                            // disagree with sheet 1 by exactly this many videos.
                            <p className="mt-2.5 text-[7.5pt] leading-relaxed text-gray-500">
                                {unattributed} completed {unattributed === 1 ? 'video has' : 'videos have'} no
                                editor recorded, so {unattributed === 1 ? 'it is' : 'they are'} counted in the
                                team total on sheet 1 but credited to nobody here.
                            </p>
                        )}
                    </section>

                    {roleRows.length > 0 && (
                        <>
                            <SectionRule>Project roles</SectionRule>

                            <section>
                                <SectionTitle keepWithNext>By role, widest coverage first</SectionTitle>
                                <ul className="mt-3 space-y-2.5">
                                    {roleRows.map(({ role, member, credit }) => (
                                        <li
                                            key={`${role}:${member.id}`}
                                            className="report-row grid grid-cols-[1fr_auto] items-center gap-x-4"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-[9.5pt] leading-snug">
                                                    {member.full_name}
                                                    <span className="text-gray-400"> · </span>
                                                    <span className="text-gray-600">{role}</span>
                                                </p>
                                                <p className="truncate text-[7.5pt] leading-snug text-gray-500">
                                                    {credit.completedVideos} videos ·{' '}
                                                    {formatMinutes(credit.minutesCompleted)} ·{' '}
                                                    {credit.faculties.length}{' '}
                                                    {credit.faculties.length === 1 ? 'faculty' : 'faculties'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-3 w-[46mm] overflow-hidden rounded-sm bg-gray-100">
                                                    <div
                                                        style={{
                                                            width: `${(credit.projects.length / Math.max(1, projects.length)) * 100}%`,
                                                            height: '100%',
                                                            background: DONE_COLOUR,
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-14 text-right text-[8.5pt] font-semibold tabular-nums">
                                                    {credit.projects.length}/{projects.length}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-2.5 text-[7.5pt] leading-relaxed text-gray-500">
                                    The bar is how much of the term each person&rsquo;s role covered. These roles
                                    have no per-video column, so they are credited with every video in the
                                    projects assigned — their figures overlap the editing table above rather
                                    than adding to it, and the two are never summed.
                                </p>
                            </section>
                        </>
                    )}

                    <section className="report-block">
                        <SectionTitle>Everyone on the team</SectionTitle>
                        <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[8.5pt]">
                            {members.map(member => (
                                <li key={member.id} className="flex items-center gap-1.5">
                                    <span
                                        className={`inline-block rounded-full border px-2 py-0.5 text-[7pt] font-semibold uppercase tracking-[0.06em] ${roleTheme(member.role).headingClass}`}
                                    >
                                        {member.role ?? 'No role'}
                                    </span>
                                    {member.full_name}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <Footer>Sheet 2 of 3 · People</Footer>
            </article>

            {/* ============================ SHEET 3 ============================ */}
            <article className={sheet}>
                <Masthead
                    kicker="Team report · Quality"
                    title="How it was received"
                    chip={`${ratedProjects} of ${projects.length} rated`}
                    terms={termNames}
                    generatedAt={generatedAt}
                />

                <div className="mt-7 flex-1 space-y-7">
                    <SectionRule>Lecturer satisfaction</SectionRule>

                    {scores.responses > 0 ? (
                        <section className="report-block rounded border border-gray-200 px-4 py-3">
                            <div className="flex items-baseline justify-between">
                                <SectionTitle>Average score by category</SectionTitle>
                                <span className="text-[8pt] text-gray-500">
                                    {scores.responses} {scores.responses === 1 ? 'response' : 'responses'} from{' '}
                                    {projects.length} projects
                                </span>
                            </div>
                            <div className="mt-3 grid grid-cols-5 gap-3">
                                {scores.categories.map(c => (
                                    c.score != null
                                        ? <Rating key={c.label} label={c.label} score={c.score} />
                                        : (
                                            <div key={c.label}>
                                                <p className="text-[13pt] font-bold leading-none text-gray-300">—</p>
                                                <p className="mt-3 text-[7.5pt] text-gray-500">{c.label}</p>
                                            </div>
                                        )
                                ))}
                            </div>
                            <p className="mt-3 text-[7.5pt] leading-relaxed text-gray-500">
                                The form is submitted once per completed project and scores the whole team, so
                                these are properties of the work rather than of any individual. A project with
                                no form submitted is not counted as a low score — it is not counted at all.
                            </p>
                        </section>
                    ) : (
                        <p className="report-block rounded border border-dashed border-gray-300 p-5 text-center text-[9pt] text-gray-500">
                            No feedback forms submitted for these terms.
                        </p>
                    )}

                    <SectionRule>What reached the lecturer</SectionRule>

                    <section>
                        <SectionTitle keepWithNext>Deliverable completeness</SectionTitle>
                        <ul className="mt-3 space-y-2.5">
                            <CoverageRow
                                label="Projects with every video completed"
                                note="the whole course delivered, not just most of it"
                                have={deliverable.fullyDelivered}
                                total={deliverable.projects}
                            />
                            <CoverageRow
                                label="Completed videos marked as having an English subtitle"
                                have={deliverable.withEnglishSubtitles}
                                total={deliverable.completedVideos}
                            />
                            <CoverageRow
                                label="Completed videos marked as having an Indonesian subtitle"
                                have={deliverable.withIndonesianSubtitles}
                                total={deliverable.completedVideos}
                            />
                            <CoverageRow
                                label="Completed videos with a link recorded"
                                note="without one the video cannot be found again from here"
                                have={deliverable.withLink}
                                total={deliverable.completedVideos}
                            />
                        </ul>
                        {/* "Marked as", not "with". The subtitle columns are tick boxes somebody
                            has to remember to tick, and a near-empty row here is at least as
                            likely to mean the box is unused as it is to mean the subtitles were
                            never made. Stating the stronger claim would put a number in front of
                            a manager that the team cannot defend. */}
                        <p className="mt-3 text-[7.5pt] leading-relaxed text-gray-500">
                            Subtitles are recorded as a tick box on each video. A low figure here means
                            the box is unticked, which may be because the subtitle does not exist or
                            because nobody recorded that it does — this report cannot tell the two apart.
                        </p>
                    </section>

                    <SectionRule>How well the tracker is filled in</SectionRule>

                    <section>
                        <SectionTitle keepWithNext>Data completeness</SectionTitle>
                        <ul className="mt-3 space-y-2.5">
                            <CoverageRow
                                label="Videos with an editor recorded"
                                note="a video with none is credited to nobody in any report"
                                have={tracker.withEditor}
                                total={tracker.videos}
                            />
                            <CoverageRow
                                label="Videos with a duration recorded"
                                note="a video with none is missing from every runtime figure"
                                have={tracker.withDuration}
                                total={tracker.videos}
                            />
                            <CoverageRow
                                label="Videos with a delivery date"
                                note="the only way punctuality can be measured at all"
                                have={tracker.withDeliveryDate}
                                total={tracker.videos}
                            />
                            <CoverageRow
                                label="Videos with their own deadline"
                                note="the rest inherit the project's, which is correct, not a gap"
                                have={tracker.withOwnDeadline}
                                total={tracker.videos}
                                neutral
                            />
                        </ul>
                        <p className="mt-3 text-[7.5pt] leading-relaxed text-gray-500">
                            This section is about the record, not the work. Every gap here weakens a figure
                            somewhere else in this report, which is why it is printed alongside them rather
                            than kept as an administrative note.
                        </p>
                    </section>
                </div>

                <Footer>Sheet 3 of 3 · Quality and record-keeping</Footer>
            </article>
        </>
    );
}

/** A labelled stacked bar over a legend that names every segment and its share. */
function StatusBar({
    segments,
    total,
    unit,
}: {
    segments: { label: string; count: number; colour: string }[];
    total: number;
    unit: string;
}) {
    if (total === 0) return null;

    return (
        <div className="mt-3">
            <div className="flex h-3.5 overflow-hidden rounded-sm bg-gray-100">
                {segments.map(s => (
                    <div
                        key={s.label}
                        style={{ width: `${(s.count / total) * 100}%`, background: s.colour }}
                        title={`${s.label}: ${s.count}`}
                    />
                ))}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[8pt] text-gray-600">
                {segments.map(s => (
                    <li key={s.label} className="flex items-center gap-1.5">
                        <Swatch color={s.colour} />
                        {s.label}
                        <span className="font-semibold tabular-nums">{s.count}</span>
                        <span className="text-gray-400">
                            ({((s.count / total) * 100).toFixed(0)}%)
                        </span>
                    </li>
                ))}
                <li className="text-gray-400">
                    {total} {unit} in total
                </li>
            </ul>
        </div>
    );
}
