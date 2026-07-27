// src/app/reports/MemberReport.tsx
//
// A member's work report. Flows onto a second sheet when someone has a lot of projects
// rather than truncating — a report that hides half your work is worse than a long one.
//
// Charts are plain CSS and inline SVG, not a chart library. Recharts renders through a
// ResponsiveContainer that measures the viewport, which has no meaning on paper and
// prints unpredictably; bars built from divs measure themselves against the page.
'use client';

import {
    editorCredit,
    projectRoleCredit,
    satisfaction,
    type MetricProject,
} from '@/lib/reports/metrics';
import { roleTheme } from '@/lib/roles';
import { SERIES, INK, formatMinutes } from '@/components/insight/tokens';

export type ReportMember = {
    id: string;
    full_name: string;
    role: string | null;
    projectRoles: string[];
};

/** Totals across everyone, so a member can be placed against the team. */
export type TeamTotals = { completedVideos: number; minutes: number };

type Props = {
    member: ReportMember;
    projects: MetricProject[];
    termNames: string[];
    generatedAt: string;
    team: TeamTotals;
};

/**
 * The project-assignment roles that get their own section.
 *
 * `Main Editor / Videographer` is deliberately absent. It is a real row in
 * `project_assignments`, but it only seeds the default editor on each video — the credit
 * itself is per-video and already reported above (AI_README §8). Listing it here would
 * count the same work twice on one page, and would credit an editor for videos a
 * per-video override moved to somebody else.
 */
const PROJECT_ROLES = [
    'Sound Engineer',
    'Instructional Designer',
    'Assistant Editor',
    'Assistant Videographer',
] as const;

/**
 * Which lecturer ratings to surface under each role.
 *
 * The feedback form is submitted once per project and scores the whole team, so these are
 * never presented as an individual's score — the heading says so. They are still worth
 * showing per role, because the categories nearest somebody's actual job are the ones
 * they can act on: an instructional designer owns the shape of the course and the
 * conversation with the lecturer; a sound engineer's work lands in technical quality.
 */
const ROLE_RATINGS: Record<string, string[]> = {
    'Instructional Designer': ['Pre-production', 'Communication', 'Final product'],
    'Sound Engineer': ['Quality', 'Timeliness', 'Final product'],
    'Assistant Editor': ['Quality', 'Final product'],
    'Assistant Videographer': ['Quality', 'Final product'],
};

/**
 * Completion state owns the first two palette slots on this page: blue is "completed" and
 * orange is "in production" wherever a bar is split.
 *
 * Those two meanings hold for the whole sheet, so the categorical faculty colours start
 * after them. Sharing a colour across the two legends would make blue mean "completed" in
 * one chart and "Fakultas Ilmu Sosial dan Ilmu Politik" three centimetres below it.
 */
const DONE_COLOUR = SERIES[0];
const IN_PRODUCTION_COLOUR = SERIES[1];
const FACULTY_COLOURS = SERIES.slice(2);

export default function MemberReport({ member, projects, termNames, generatedAt, team }: Props) {
    const editor = editorCredit(projects, member.id);
    const isEditor = editor.completedVideos > 0 || editor.videosInProduction > 0;

    const roleSections = PROJECT_ROLES
        .filter(role => member.projectRoles.includes(role))
        .map(role => ({ role, credit: projectRoleCredit(projects, member.id, role) }))
        .filter(section => section.credit.projects.length > 0);

    const theme = roleTheme(member.role);
    const nothingToReport = !isEditor && roleSections.length === 0;

    const avgLength = editor.completedVideos > 0
        ? editor.minutesCompleted / editor.completedVideos
        : 0;
    const shareOfVideos = team.completedVideos > 0
        ? (editor.completedVideos / team.completedVideos) * 100
        : 0;
    const shareOfMinutes = team.minutes > 0
        ? (editor.minutesCompleted / team.minutes) * 100
        : 0;

    // One faculty→colour map for the WHOLE sheet, built from every project the member
    // touches in any role. Colouring each chart independently would give the same faculty
    // two different swatches on one page, which is exactly what a legend exists to prevent.
    const facultyColour = buildFacultyColours([
        ...editor.projects.map(r => r.project),
        ...roleSections.flatMap(s => s.credit.projects.map(r => r.project)),
    ]);

    const editorFaculties = facultySplit(
        editor.projects.map(r => ({ project: r.project, videos: r.credited })),
        facultyColour,
    );

    return (
        <article className="report-page flex flex-col p-[13mm] text-[10pt] text-gray-900 shadow-lg print:shadow-none">
            {/* A masthead, not a title bar. Three rows between two rules, each row a left
                and a right item sharing a baseline: what this is, who it is about, and what
                it covers. The previous version stacked four things in two corners with
                nothing aligning to anything, which is what made a neat page open untidily. */}
            <header className="report-block">
                <div className="flex items-baseline justify-between gap-6 border-b border-gray-300 pb-2">
                    <p className="text-[7.5pt] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        DCS Project Tracker
                    </p>
                    <p className="text-[7.5pt] font-semibold uppercase tracking-[0.18em] text-gray-400">
                        Work report
                    </p>
                </div>

                <div className="mt-4 flex items-baseline justify-between gap-6">
                    <h1 className="text-[22pt] font-bold leading-none tracking-tight">
                        {member.full_name}
                    </h1>
                    <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[7pt] font-semibold uppercase tracking-[0.08em] ${theme.headingClass}`}
                    >
                        {member.role ?? 'No role assigned'}
                    </span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between gap-6 border-b-2 border-gray-900 pb-2.5 text-[8.5pt] text-gray-500">
                    <p>
                        {termNames.length === 1 ? 'Term' : 'Terms'} {termNames.join(' · ')}
                    </p>
                    {/* The date belongs in the masthead where a reader looks for it, rather
                        than in small print at the foot of the last page. */}
                    <p>Generated {generatedAt}</p>
                </div>
            </header>

            {nothingToReport ? (
                <p className="report-block mt-6 rounded border border-dashed border-gray-300 p-6 text-center text-gray-500">
                    No work recorded in {termNames.length === 1 ? 'this term' : 'these terms'}.
                </p>
            ) : (
                <div className="mt-7 flex-1 space-y-7">
                    {isEditor && (
                        <>
                            <SectionRule>Editing</SectionRule>

                            <section className="report-block grid grid-cols-5 gap-2.5">
                                <Figure value={String(editor.completedVideos)} label="videos completed" lead />
                                <Figure value={formatMinutes(editor.minutesCompleted)} label="runtime" lead />
                                <Figure value={`${avgLength.toFixed(1)}m`} label="avg per video" />
                                <Figure value={String(editor.videosInProduction)} label="in production" />
                                <Figure value={String(editor.projects.length)} label="projects" />
                            </section>

                            <ShareOfTeam
                                shareOfVideos={shareOfVideos}
                                shareOfMinutes={shareOfMinutes}
                                team={team}
                            />

                            {/* Not a `report-block`: a long project list is allowed to carry
                                over to the next sheet. Its individual rows are the units that
                                may not be split, and the heading is glued to the first of them. */}
                            <section>
                                <SectionTitle keepWithNext>Videos per project</SectionTitle>
                                <ProjectBars
                                    rows={editor.projects.map(r => ({
                                        project: r.project,
                                        completed: r.completed,
                                        inProduction: r.inProduction,
                                        total: r.credited,
                                    }))}
                                />
                            </section>

                            {editorFaculties.length > 0 && (
                                <section className="report-block">
                                    <SectionTitle>Faculties</SectionTitle>
                                    <FacultySplit split={editorFaculties} />
                                </section>
                            )}

                            <OnTime punctuality={editor.punctuality} />
                        </>
                    )}

                    {roleSections.length > 0 && (
                        <>
                            <SectionRule>
                                {isEditor ? 'Also credited on projects' : 'Credited on projects'}
                            </SectionRule>

                            {roleSections.map(({ role, credit }) => (
                                <RoleSection
                                    key={role}
                                    role={role}
                                    credit={credit}
                                    termProjectCount={projects.length}
                                    facultyColour={facultyColour}
                                />
                            ))}

                            {/* Said once for the whole section rather than repeated under each
                                role. Still said, because without it a reader totalling the page
                                double-counts the same videos (AI_README §8). */}
                            <p className="report-block text-[7.5pt] leading-relaxed text-gray-500">
                                These roles have no per-video column, so they are credited with every
                                video in the projects assigned. Their figures overlap the editing credit
                                above — and each other&rsquo;s — rather than adding to it.
                            </p>
                        </>
                    )}
                </div>
            )}

            <footer className="report-block mt-auto pt-7 text-[7pt] text-gray-400 print:mt-8">
                <span className="block border-t border-gray-200 pt-2">
                    Editing credit follows the editor named on each video. Project roles are
                    credited across every video in the projects they are assigned to.
                </span>
            </footer>
        </article>
    );
}

// ---------------------------------------------------------------------------
// Project roles
// ---------------------------------------------------------------------------

/**
 * One project role's whole story: how much, how far across the term, which faculties, and
 * what the lecturers said.
 *
 * Given the same treatment as the editing section rather than a one-line summary, because
 * for some people it IS their work — the sound engineer is on nearly every project the
 * team runs, and a single row saying "20 projects" is not a report of that.
 */
function RoleSection({
    role,
    credit,
    termProjectCount,
    facultyColour,
}: {
    role: string;
    credit: ReturnType<typeof projectRoleCredit>;
    termProjectCount: number;
    facultyColour: Map<string, string>;
}) {
    const projectsOnRole = credit.projects.map(r => r.project);
    const coverage = termProjectCount > 0
        ? (credit.projects.length / termProjectCount) * 100
        : 0;

    const scores = satisfaction(projectsOnRole);
    const wanted = ROLE_RATINGS[role] ?? [];
    const shownScores = scores.categories.filter(c => wanted.includes(c.label) && c.score != null);

    const split = facultySplit(
        credit.projects.map(r => ({
            project: r.project,
            videos: (r.project.videos ?? []).length,
        })),
        facultyColour,
    );

    return (
        <section className="space-y-4">
            <div className="report-block">
                <h3 className="text-[11.5pt] font-bold tracking-tight">{role}</h3>
                <p className="mt-0.5 text-[8pt] text-gray-500">
                    On {credit.projects.length} of the {termProjectCount} projects in these terms
                    {' — '}{coverage.toFixed(0)}% of the term&rsquo;s work.
                </p>

                <div className="mt-3 grid grid-cols-4 gap-2.5">
                    <Figure value={String(credit.completedVideos)} label="videos completed" lead />
                    <Figure value={formatMinutes(credit.minutesCompleted)} label="runtime" lead />
                    <Figure value={String(credit.videosInProduction)} label="in production" />
                    <Figure value={String(credit.faculties.length)} label="faculties" />
                </div>
            </div>

            <div>
                <SectionTitle keepWithNext>Projects</SectionTitle>
                <ProjectBars
                    rows={credit.projects.map(r => ({
                        project: r.project,
                        completed: r.completed,
                        inProduction: r.inProduction,
                        // The denominator is every video in the project, not just the ones
                        // moving: credit for these roles is project-wide by definition.
                        total: (r.project.videos ?? []).length,
                    }))}
                />
            </div>

            {split.length > 1 && (
                <div className="report-block">
                    <SectionTitle>Faculties</SectionTitle>
                    <FacultySplit split={split} />
                </div>
            )}

            {shownScores.length > 0 && (
                <div className="report-block rounded border border-gray-200 px-4 py-3">
                    <div className="flex items-baseline justify-between">
                        <SectionTitle>Lecturer ratings on these projects</SectionTitle>
                        <span className="text-[8pt] text-gray-500">
                            {scores.responses} of {credit.projects.length} rated
                        </span>
                    </div>
                    {/* Named as a property of the projects, never of the person: the form is
                        submitted once per project and scores the whole team. */}
                    <div className="mt-3 grid grid-cols-3 gap-3">
                        {shownScores.map(c => (
                            <Rating key={c.label} label={c.label} score={c.score as number} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

function Rating({ label, score }: { label: string; score: number }) {
    return (
        <div>
            <div className="flex items-baseline gap-1">
                <span className="text-[13pt] font-bold leading-none tabular-nums">
                    {score.toFixed(1)}
                </span>
                <span className="text-[8pt] text-gray-400">/ 5</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                    className="h-full rounded-full"
                    style={{ width: `${(score / 5) * 100}%`, background: DONE_COLOUR }}
                />
            </div>
            <p className="mt-1 text-[7.5pt] text-gray-500">{label}</p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

/** Where this person sits against the whole team, as two proportion bars. */
function ShareOfTeam({
    shareOfVideos,
    shareOfMinutes,
    team,
}: {
    shareOfVideos: number;
    shareOfMinutes: number;
    team: TeamTotals;
}) {
    if (team.completedVideos === 0) return null;

    return (
        <section className="report-block rounded border border-gray-200 px-4 py-3">
            <div className="flex items-baseline justify-between">
                <SectionTitle>Share of team output</SectionTitle>
                <span className="text-[8pt] text-gray-500">
                    team: {team.completedVideos} videos · {formatMinutes(team.minutes)}
                </span>
            </div>
            <div className="mt-3 space-y-2.5">
                <ShareRow label="Videos" value={shareOfVideos} />
                <ShareRow label="Runtime" value={shareOfMinutes} />
            </div>
        </section>
    );
}

function ShareRow({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-[8.5pt] text-gray-600">{label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(1, Math.min(100, value))}%`, background: DONE_COLOUR }}
                />
            </div>
            <span className="w-9 shrink-0 text-right text-[8.5pt] font-semibold tabular-nums">
                {value.toFixed(0)}%
            </span>
        </div>
    );
}

/**
 * One bar per project, scaled to the largest. The completed portion is filled solid and
 * the remainder hollow, so "how much is done" and "how big is it" read from the same bar
 * instead of two number columns.
 */
function ProjectBars({
    rows,
}: {
    rows: { project: MetricProject; completed: number; inProduction: number; total: number }[];
}) {
    const max = Math.max(...rows.map(r => r.total), 1);
    const anyParked = rows.some(r => r.total - r.completed - r.inProduction > 0);

    return (
        <ul className="mt-3 space-y-2.5">
            {rows.map(({ project, completed, inProduction, total }) => {
                return (
                    <li key={project.id} className="report-row grid grid-cols-[1fr_auto] items-center gap-x-4">
                        <div className="min-w-0">
                            <p className="truncate text-[9.5pt] leading-snug" title={project.course_name ?? ''}>
                                {project.course_name}
                            </p>
                            <p className="truncate text-[7.5pt] leading-snug text-gray-500">
                                {project.faculties?.name ?? '—'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            {/* Only completed and in-production are drawn. Anything left is a
                                video in a Pending or Cancelled project, which shows as the bar's
                                own grey track — so the blue and orange lengths add up to the
                                headline figures instead of quietly absorbing parked work. */}
                            <div className="flex h-3 w-[46mm] overflow-hidden rounded-sm bg-gray-100">
                                <div style={{ width: `${(completed / max) * 100}%`, background: DONE_COLOUR }} />
                                <div style={{ width: `${(inProduction / max) * 100}%`, background: IN_PRODUCTION_COLOUR }} />
                            </div>
                            <span className="w-10 text-right text-[8.5pt] font-semibold tabular-nums">
                                {completed}/{total}
                            </span>
                        </div>
                    </li>
                );
            })}
            <li className="report-row flex items-center gap-3 pt-1 text-[7.5pt] text-gray-500">
                <Swatch color={DONE_COLOUR} /> completed
                <Swatch color={IN_PRODUCTION_COLOUR} /> in production
                {anyParked && (
                    <>
                        <Swatch color="#e5e7eb" /> pending or cancelled
                    </>
                )}
            </li>
        </ul>
    );
}

type FacultySlice = { name: string; count: number; colour: string };

/** A single stacked bar: which faculties the work went to, by video count. */
function FacultySplit({ split }: { split: FacultySlice[] }) {
    const total = split.reduce((s, f) => s + f.count, 0);
    if (total === 0) return null;

    return (
        <div className="mt-3">
            <div className="flex h-3.5 overflow-hidden rounded-sm">
                {split.map(f => (
                    <div
                        key={f.name}
                        style={{ width: `${(f.count / total) * 100}%`, background: f.colour }}
                        title={`${f.name}: ${f.count}`}
                    />
                ))}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[8pt] text-gray-600">
                {split.map(f => (
                    <li key={f.name} className="flex items-center gap-1.5">
                        <Swatch color={f.colour} />
                        {f.name}
                        <span className="font-semibold tabular-nums">{f.count}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * Assign a colour to every faculty on the sheet, biggest first.
 *
 * Palette slots are used in order and never cycled (tokens.ts): a repeat would put the
 * same swatch against two different faculties in one legend. Past the last slot a faculty
 * falls back to grey — still labelled, just no longer distinctly coloured.
 */
function buildFacultyColours(projects: MetricProject[]): Map<string, string> {
    const counts = new Map<string, number>();
    for (const project of projects) {
        const name = project.faculties?.name ?? 'Unassigned';
        counts.set(name, (counts.get(name) ?? 0) + (project.videos ?? []).length);
    }

    return new Map(
        [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([name], i) => [name, FACULTY_COLOURS[i] ?? INK.muted]),
    );
}

/** Video counts per faculty, ordered biggest first, wearing the sheet's shared colours. */
function facultySplit(
    rows: { project: MetricProject; videos: number }[],
    colours: Map<string, string>,
): FacultySlice[] {
    const counts = new Map<string, number>();
    for (const { project, videos } of rows) {
        const name = project.faculties?.name ?? 'Unassigned';
        counts.set(name, (counts.get(name) ?? 0) + videos);
    }

    return [...counts.entries()]
        .map(([name, count]) => ({ name, count, colour: colours.get(name) ?? INK.muted }))
        .sort((a, b) => b.count - a.count);
}

/**
 * One line, not a panel. Still present when unmeasurable: a report that simply omits
 * punctuality reads as though it were fine (AI_README §11).
 */
function OnTime({ punctuality }: { punctuality: ReturnType<typeof editorCredit>['punctuality'] }) {
    const { rate, onTime, late, notTracked } = punctuality;

    return (
        <section className="report-block rounded border border-gray-200 px-4 py-2.5 text-[8.5pt]">
            <span className="font-semibold">On-time delivery: </span>
            {rate != null ? (
                <span>
                    {rate.toFixed(0)}% — {onTime} on time, {late} late
                    {notTracked > 0 && `, ${notTracked} not tracked`}
                </span>
            ) : (
                <span className="text-gray-600">
                    not tracked for these terms — delivery dates start from July 2026
                </span>
            )}
        </section>
    );
}

// ---------------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------------

function Swatch({ color }: { color: string }) {
    return (
        <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 rounded-[1px]"
            style={{ background: color }}
        />
    );
}

/** Divides the sheet into its two halves — the work you did, and the work you were on. */
function SectionRule({ children }: { children: React.ReactNode }) {
    return (
        <div className="report-keep-with-next flex items-center gap-3 pt-1">
            <h2 className="text-[8pt] font-bold uppercase tracking-[0.14em] text-gray-900">
                {children}
            </h2>
            <span className="h-px flex-1 bg-gray-300" />
        </div>
    );
}

function SectionTitle({ children, keepWithNext = false }: { children: React.ReactNode; keepWithNext?: boolean }) {
    return (
        <h3
            className={`text-[7.5pt] font-bold uppercase tracking-[0.1em] text-gray-400 ${keepWithNext ? 'report-keep-with-next' : ''}`}
        >
            {children}
        </h3>
    );
}

function Figure({ value, label, lead = false }: { value: string; label: string; lead?: boolean }) {
    return (
        <div className={`rounded border px-2.5 py-3 ${lead ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
            <p className={`font-bold leading-none tracking-tight ${lead ? 'text-[17pt]' : 'text-[14pt]'}`}>
                {value}
            </p>
            <p className="mt-1.5 text-[7.5pt] leading-snug text-gray-500">{label}</p>
        </div>
    );
}
