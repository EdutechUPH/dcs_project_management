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
    RatingRow,
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

const sheet = 'report-page flex flex-col p-[13mm] text-[10pt] text-gray-900 shadow-lg print:shadow-none';

/**
 * Each sheet's title, named once so the masthead and the footer cannot disagree — a footer
 * that calls sheet 2 something other than the heading at the top of it is how a reader
 * loses track of which page they are holding.
 */
const SHEET_TITLES = [
    'Digital Content Specialist Report',
    'Contributors',
    'How it was received',
] as const;

const footer = (index: number) => `Sheet ${index + 1} of ${SHEET_TITLES.length} · ${SHEET_TITLES[index]}`;

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

    /**
     * Everyone holding any of `roles`, credited across the union of those roles rather
     * than once per role — see `projectRoleCredit`. `held` is what they are actually
     * called, so a combined group can still name each person's own role.
     */
    const roleGroup = (roles: readonly string[]) =>
        members
            .filter(member => roles.some(role => member.projectRoles.includes(role)))
            .map(member => ({
                member,
                credit: projectRoleCredit(projects, member.id, [...roles]),
                held: roles.filter(role => member.projectRoles.includes(role)),
            }))
            .filter(row => row.credit.projects.length > 0)
            .sort((a, b) => b.credit.projects.length - a.credit.projects.length);

    // `Main Editor / Videographer` is deliberately not a group. It is a real row in
    // `project_assignments`, but it only seeds the default editor on each video — the credit
    // itself is per-video and is the "Video editors" list above. A group for it would count
    // the same work twice on one sheet (§8).
    const soundRows = roleGroup(['Sound Engineer']);
    // One group, not two. Somebody who is both on the same project would otherwise appear
    // twice with the same videos counted under each title.
    const assistantRows = roleGroup(['Assistant Editor', 'Assistant Videographer']);
    const designerRows = roleGroup(['Instructional Designer']);

    const contributorCount = new Set([
        ...editors.map(e => e.member.id),
        ...soundRows.map(r => r.member.id),
        ...assistantRows.map(r => r.member.id),
        ...designerRows.map(r => r.member.id),
    ]).size;

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
                    title={SHEET_TITLES[0]}
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

                <Footer>{footer(0)}</Footer>
            </article>

            {/* ============================ SHEET 2 ============================ */}
            <article className={sheet}>
                <Masthead
                    kicker="Team report · People"
                    title={SHEET_TITLES[1]}
                    chip={`${contributorCount} people`}
                    terms={termNames}
                    generatedAt={generatedAt}
                />

                <div className="mt-7 flex-1 space-y-7">
                    {/* Grouped by the KIND of contribution, not by whose profile carries which
                        role. The colour is the app's role scheme (§9), so the two halves of the
                        team read the same here as they do in every member dropdown. */}
                    <CategoryRule role="Digital Content Specialist">
                        Digital Content Specialist
                    </CategoryRule>

                    <section>
                        <div className="flex items-baseline justify-between">
                            <SectionTitle keepWithNext>Video editors</SectionTitle>
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
                                        {/* Scaled to the busiest editor, not to the term: this bar
                                            is output against your peers, where the role bars below
                                            are coverage of the term. */}
                                        <div className="flex h-3 w-[46mm] overflow-hidden rounded-sm bg-gray-100">
                                            <div
                                                style={{
                                                    width: `${(credit.completedVideos / Math.max(1, editors[0].credit.completedVideos)) * 100}%`,
                                                    background: DONE_COLOUR,
                                                }}
                                            />
                                        </div>
                                        <span className="w-14 text-right text-[8.5pt] font-semibold tabular-nums">
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

                    <RoleGroup
                        title={soundRows.length === 1 ? 'Sound engineer' : 'Sound engineers'}
                        rows={soundRows}
                        termProjects={projects.length}
                    />

                    <RoleGroup
                        title="Assistant editors and videographers"
                        rows={assistantRows}
                        termProjects={projects.length}
                        // Two roles in one group, so each person's own title is worth naming.
                        showHeldRoles
                    />

                    <CategoryRule role="Instructional Designer">
                        Instructional Designer
                    </CategoryRule>

                    <RoleGroup rows={designerRows} termProjects={projects.length} />
                </div>

                <Footer>{footer(1)}</Footer>
            </article>

            {/* ============================ SHEET 3 ============================ */}
            <article className={sheet}>
                <Masthead
                    kicker="Team report · Quality"
                    title={SHEET_TITLES[2]}
                    chip={`${ratedProjects} of ${projects.length} rated`}
                    terms={termNames}
                    generatedAt={generatedAt}
                />

                <div className="mt-7 flex-1 space-y-7">
                    <SectionRule>Lecturer satisfaction</SectionRule>

                    {scores.responses > 0 ? (
                        <>
                            <section className="report-block grid grid-cols-4 gap-2.5">
                                <Figure
                                    value={scores.overall != null ? scores.overall.toFixed(1) : '—'}
                                    label="overall score, out of 5"
                                    lead
                                />
                                <Figure
                                    value={scores.finalProduct != null ? scores.finalProduct.toFixed(1) : '—'}
                                    label="final product"
                                    lead
                                />
                                <Figure value={String(scores.responses)} label="lecturers responded" />
                                <Figure
                                    value={`${((scores.responses / Math.max(1, projects.length)) * 100).toFixed(0)}%`}
                                    label={`of ${projects.length} projects rated`}
                                />
                            </section>

                            <section>
                                <SectionTitle keepWithNext>Score by category</SectionTitle>
                                <ul className="mt-3 space-y-2.5">
                                    {scores.categories.map(c => (
                                        <RatingRow key={c.label} {...c} />
                                    ))}
                                </ul>
                            </section>
                        </>
                    ) : (
                        <p className="report-block rounded border border-dashed border-gray-300 p-5 text-center text-[9pt] text-gray-500">
                            No feedback forms submitted for these terms.
                        </p>
                    )}

                    <SectionRule>Subtitles</SectionRule>

                    <section>
                        <ul className="space-y-2.5">
                            {/* "Marked as", not "with": these are tick boxes somebody has to
                                remember to tick, so a near-empty row is at least as likely to mean
                                the box is unused as it is to mean the subtitles were never made. */}
                            <CoverageRow
                                label="Completed videos marked as having an Indonesian subtitle"
                                have={deliverable.withIndonesianSubtitles}
                                total={deliverable.completedVideos}
                            />
                            <CoverageRow
                                label="Completed videos marked as having an English subtitle"
                                have={deliverable.withEnglishSubtitles}
                                total={deliverable.completedVideos}
                            />
                        </ul>
                    </section>

                    <SectionRule>Data completion</SectionRule>

                    <section>
                        <ul className="space-y-2.5">
                            <CoverageRow
                                label="Videos with an editor recorded"
                                have={tracker.withEditor}
                                total={tracker.videos}
                            />
                            <CoverageRow
                                label="Videos with a duration recorded"
                                have={tracker.withDuration}
                                total={tracker.videos}
                            />
                            <CoverageRow
                                label="Videos with a delivery date"
                                have={tracker.withDeliveryDate}
                                total={tracker.videos}
                            />
                            {/* `neutral` keeps this one grey rather than red: most videos correctly
                                inherit their project's deadline, so colouring a low number as a
                                failure would teach the reader to distrust the rows that are. */}
                            <CoverageRow
                                label="Videos with their own deadline"
                                have={tracker.withOwnDeadline}
                                total={tracker.videos}
                                neutral
                            />
                        </ul>
                    </section>
                </div>

                <Footer>{footer(2)}</Footer>
            </article>
        </>
    );
}

type RoleRow = {
    member: TeamMember;
    credit: ReturnType<typeof projectRoleCredit>;
    held: string[];
};

/**
 * A contribution category, wearing the app's role colour (§9).
 *
 * The colour is the point: it is the same blue and purple that band these people in every
 * member dropdown, so the two halves of the team are recognisable here without the reader
 * having to read the heading at all.
 */
function CategoryRule({ role, children }: { role: string; children: React.ReactNode }) {
    const theme = roleTheme(role);

    return (
        <div className="report-keep-with-next flex items-center gap-3 pt-1">
            <span
                className={`rounded-full border px-2.5 py-1 text-[8pt] font-bold uppercase tracking-[0.12em] ${theme.headingClass}`}
            >
                {children}
            </span>
            <span className="h-px flex-1 bg-gray-300" />
        </div>
    );
}

/**
 * People credited through a project assignment rather than per video.
 *
 * The bar is coverage — how much of the term this role reached — because that is what a
 * project-wide credit actually measures. Using video counts here would invite the reader
 * to add them to the editing table above, which double-counts every video (§8).
 */
function RoleGroup({
    title,
    rows,
    termProjects,
    showHeldRoles = false,
}: {
    title?: string;
    rows: RoleRow[];
    termProjects: number;
    showHeldRoles?: boolean;
}) {
    if (rows.length === 0) return null;

    return (
        <section>
            {title && <SectionTitle keepWithNext>{title}</SectionTitle>}
            <ul className={title ? 'mt-3 space-y-2.5' : 'space-y-2.5'}>
                {rows.map(({ member, credit, held }) => (
                    <li key={member.id} className="report-row grid grid-cols-[1fr_auto] items-center gap-x-4">
                        <div className="min-w-0">
                            <p className="truncate text-[9.5pt] leading-snug">
                                {member.full_name}
                                {showHeldRoles && held.length > 0 && (
                                    <>
                                        <span className="text-gray-400"> · </span>
                                        <span className="text-gray-600">{held.join(' & ')}</span>
                                    </>
                                )}
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
                                        width: `${(credit.projects.length / Math.max(1, termProjects)) * 100}%`,
                                        height: '100%',
                                        background: DONE_COLOUR,
                                    }}
                                />
                            </div>
                            <span className="w-14 text-right text-[8.5pt] font-semibold tabular-nums">
                                {credit.projects.length}/{termProjects}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
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
