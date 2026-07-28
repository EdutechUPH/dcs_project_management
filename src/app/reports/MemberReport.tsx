// src/app/reports/MemberReport.tsx
//
// One member's work report. Flows onto a second sheet when someone has a lot of projects
// rather than truncating — a report that hides half your work is worse than a long one.
//
// Charts come from ./parts as plain CSS, not a chart library. Recharts renders through a
// ResponsiveContainer that measures the viewport, which has no meaning on paper and prints
// unpredictably; bars built from divs measure themselves against the page.
'use client';

import {
    editorCredit,
    projectRoleCredit,
    satisfaction,
    videoCompleteness,
    type MetricProject,
    type MetricVideo,
} from '@/lib/reports/metrics';
import { roleTheme } from '@/lib/roles';
import { formatMinutes } from '@/components/insight/tokens';
import {
    CoverageRow,
    FacultySplit,
    Figure,
    Footer,
    Masthead,
    ProjectBars,
    Rating,
    SectionRule,
    SectionTitle,
    ShareRow,
    buildFacultyColours,
    facultySplit,
} from './parts';

export type ReportMember = {
    id: string;
    full_name: string;
    role: string | null;
    projectRoles: string[];
};

/**
 * Totals across everyone, so a member can be placed against the team.
 *
 * `editors` is carried alongside the figures because a percentage is unreadable without
 * it: with four editors an even split is 25%, so 17% reads as far worse than it is to
 * anyone who assumes a half-and-half baseline.
 */
export type TeamTotals = { completedVideos: number; minutes: number; editors: number };

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
 * count the same work twice on one page, and would credit an editor for videos a per-video
 * override moved to somebody else.
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
 * showing per role, because the categories nearest somebody's actual job are the ones they
 * can act on: an instructional designer owns the shape of the course and the conversation
 * with the lecturer; a sound engineer's work lands in technical quality.
 */
const ROLE_RATINGS: Record<string, string[]> = {
    'Instructional Designer': ['Pre-production', 'Communication', 'Final product'],
    'Sound Engineer': ['Quality', 'Timeliness', 'Final product'],
    'Assistant Editor': ['Quality', 'Final product'],
    'Assistant Videographer': ['Quality', 'Final product'],
};

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

    /**
     * The videos this person's record is graded on.
     *
     * An editor is graded on the videos they are credited with — the rows they are the one
     * expected to fill in. Somebody with no editing credit is graded on every video in the
     * projects they were assigned to, which is the same population their role credit is
     * drawn from, so the two sections cannot describe different work.
     */
    const ownVideos: MetricVideo[] = isEditor
        ? projects.flatMap(p => (p.videos ?? []).filter(v => v.main_editor_id === member.id))
        : [...new Map(
            roleSections
                .flatMap(s => s.credit.projects.map(r => r.project))
                .map(p => [p.id, p]),
        ).values()].flatMap(p => p.videos ?? []);

    const record = videoCompleteness(ownVideos);

    return (
        <article className="report-page flex flex-col p-[13mm] text-[10pt] text-gray-900 shadow-lg print:shadow-none">
            <Masthead
                kicker="Work report"
                title={member.full_name}
                chip={member.role ?? 'No role assigned'}
                chipClass={theme.headingClass}
                terms={termNames}
                generatedAt={generatedAt}
            />

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

                            {team.completedVideos > 0 && (
                                <section className="report-block rounded border border-gray-200 px-4 py-3">
                                    {/* "Editing", not "output": the denominator is editor credit only.
                                        Project-role credit is excluded, or the shares would sum past
                                        100% — the sound engineer alone is credited with more videos
                                        than the whole editing total (§8). */}
                                    <SectionTitle>Share of team editing</SectionTitle>
                                    <div className="mt-3 space-y-2.5">
                                        <ShareRow label="Videos" value={shareOfVideos} />
                                        <ShareRow label="Runtime" value={shareOfMinutes} />
                                    </div>
                                    {/* The denominator written out. As bare figures beside the heading
                                        it left the reader to guess what the percentage was a percentage
                                        OF, and to assume the even split was 50%. */}
                                    <p className="mt-2.5 text-[7.5pt] leading-relaxed text-gray-500">
                                        Of the {team.completedVideos} videos and {formatMinutes(team.minutes)}{' '}
                                        completed by the team&rsquo;s {team.editors} editors in these terms — an
                                        even split would be {(100 / team.editors).toFixed(0)}% each.
                                    </p>
                                </section>
                            )}

                            {/* Not a `report-block`: a long project list is allowed to carry over
                                to the next sheet. Its individual rows are the units that may not
                                be split, and the heading is glued to the first of them. */}
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

                    {record.videos > 0 && (
                        <>
                            <SectionRule>Data completion</SectionRule>

                            <section>
                                <ul className="space-y-2.5">
                                    <CoverageRow
                                        label="Videos with a duration recorded"
                                        have={record.withDuration}
                                        total={record.videos}
                                    />
                                    <CoverageRow
                                        label="Videos with a delivery date"
                                        have={record.withDeliveryDate}
                                        total={record.videos}
                                    />
                                    {/* Only meaningful for somebody credited through a project
                                        role: an editor's own videos all name them by definition,
                                        so the row would read 100% on every editor's sheet and
                                        measure nothing. */}
                                    {!isEditor && (
                                        <CoverageRow
                                            label="Videos with an editor recorded"
                                            have={record.withEditor}
                                            total={record.videos}
                                        />
                                    )}
                                    {/* Grey, not red — most videos correctly inherit their
                                        project's deadline. */}
                                    <CoverageRow
                                        label="Videos with their own deadline"
                                        have={record.withOwnDeadline}
                                        total={record.videos}
                                        neutral
                                    />
                                </ul>
                            </section>
                        </>
                    )}
                </div>
            )}

            <Footer>
                Editing credit follows the editor named on each video. Project roles are credited
                across every video in the projects they are assigned to.
            </Footer>
        </article>
    );
}

/**
 * One project role's whole story: how much, how far across the term, which faculties, and
 * what the lecturers said.
 *
 * Given the same treatment as the editing section rather than a one-line summary, because
 * for some people it IS their work — the sound engineer is on nearly every project the team
 * runs, and a single row saying "20 projects" is not a report of that.
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
