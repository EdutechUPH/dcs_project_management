// src/app/reports/page.tsx
//
// Report builder. Pick the terms and who the report is for; the sheets below are the
// print target and everything else is marked `print:hidden`.
//
// Scoped by TERM rather than by date, deliberately. A term says which term a course is
// FOR, not when the work happened (AI_README §13), so a monthly report scoped this way
// can contain the same video twice across two months. That is the accepted trade until
// per-video delivery dates have accumulated — the date-based version needs data that is
// only now starting to be recorded.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getYearScope } from '@/lib/academic-year';
import { editorCredit, type MetricProject } from '@/lib/reports/metrics';
import MemberReport, { type ReportMember, type TeamTotals } from './MemberReport';
import ReportControls from './ReportControls';

export const revalidate = 0;

export default async function ReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const supabase = await createClient();
    const resolved = await searchParams;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const [{ data: terms }, { data: profiles }, yearScope] = await Promise.all([
        supabase.from('terms').select('id, name, academic_year_id').order('name'),
        supabase.from('profiles').select('id, full_name, role').order('full_name'),
        getYearScope(supabase),
    ]);

    // Default to the active year's terms, matching the dashboard and analytics. An empty
    // param means the reader cleared it — the same absent-versus-empty rule used elsewhere.
    const termParam = resolved.terms;
    const selectedTermIds = termParam === undefined
        ? yearScope.activeTermIds
        : termParam.split(',').map(Number).filter(n => !Number.isNaN(n));

    const selectedTerms = (terms ?? []).filter(t => selectedTermIds.includes(t.id));

    const { data: projectRows } = selectedTermIds.length > 0
        ? await supabase
            .from('projects')
            .select(`
                id, course_name, status, due_date, term_id, faculty_id,
                faculties ( name ), prodi ( name ), lecturers ( name ), terms ( name ),
                videos ( * ),
                project_assignments ( profile_id, role ),
                feedback_submission ( * )
            `)
            .in('term_id', selectedTermIds)
        : { data: [] };

    const projects = (projectRows ?? []) as unknown as MetricProject[];

    // Everyone with work in scope, by either route: an editor named on a video, or an
    // assignment on a project. Somebody who did nothing this term gets no sheet rather
    // than an empty one.
    const projectRolesByMember = new Map<string, Set<string>>();
    const editorIds = new Set<string>();
    for (const project of projects) {
        for (const video of project.videos ?? []) {
            if (video.main_editor_id) editorIds.add(video.main_editor_id);
        }
        for (const assignment of project.project_assignments ?? []) {
            const roles = projectRolesByMember.get(assignment.profile_id) ?? new Set<string>();
            roles.add(assignment.role);
            projectRolesByMember.set(assignment.profile_id, roles);
        }
    }

    const involvedIds = new Set([...editorIds, ...projectRolesByMember.keys()]);

    const members: ReportMember[] = (profiles ?? [])
        .filter(p => involvedIds.has(p.id))
        .map(p => ({
            id: p.id,
            full_name: p.full_name ?? 'Unnamed',
            role: p.role,
            projectRoles: [...(projectRolesByMember.get(p.id) ?? [])],
        }));

    // Absent means "everyone with work" rather than "nobody" — printing the whole team is
    // the common case, and picking one person is the exception.
    const selectedMemberId = resolved.member ?? null;
    const shown = selectedMemberId
        ? members.filter(m => m.id === selectedMemberId)
        : members;

    // Team totals are summed over EVERY editor in scope, not just the sheets being shown,
    // so "share of team output" means the same thing whether one sheet is printed or all
    // of them.
    const team: TeamTotals = [...editorIds].reduce<TeamTotals>((acc, id) => {
        const credit = editorCredit(projects, id);
        return {
            completedVideos: acc.completedVideos + credit.completedVideos,
            minutes: acc.minutes + credit.minutesCompleted,
        };
    }, { completedVideos: 0, minutes: 0 });

    const generatedAt = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
    const termNames = selectedTerms.map(t => t.name);

    return (
        <div className="min-h-screen bg-gray-100 print:min-h-0 print:bg-white">
            <div className="p-8 print:hidden">
                <div className="mx-auto max-w-5xl">
                    {/* No back link: this is a sidebar destination now, so navigation belongs
                        to the sidebar rather than a one-way link to wherever it used to live. */}
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reports</h1>
                    <p className="mt-1.5 text-sm text-gray-500">
                        A sheet per team member — a second page where somebody has a lot of
                        projects. Print and choose &ldquo;Save as PDF&rdquo;: the text stays
                        selectable and searchable in the file. Turn off &ldquo;Headers and
                        footers&rdquo; in the dialog, or the browser stamps its own URL and date
                        on every sheet.
                    </p>

                    <ReportControls
                        terms={(terms ?? []).map(t => ({
                            id: t.id,
                            name: t.name,
                            yearName: yearScope.termYearName[t.id] ?? null,
                        }))}
                        selectedTermIds={selectedTermIds}
                        members={members}
                        selectedMemberId={selectedMemberId}
                        sheetCount={shown.length}
                    />
                </div>
            </div>

            <div className="space-y-8 pb-12 print:space-y-0 print:pb-0">
                {selectedTermIds.length === 0 ? (
                    <Empty>Choose at least one term to build a report.</Empty>
                ) : shown.length === 0 ? (
                    <Empty>
                        Nobody has work recorded in{' '}
                        {termNames.length === 1 ? `term ${termNames[0]}` : 'the selected terms'}.
                    </Empty>
                ) : (
                    shown.map(member => (
                        <MemberReport
                            key={member.id}
                            member={member}
                            projects={projects}
                            termNames={termNames}
                            generatedAt={generatedAt}
                            team={team}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function Empty({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto max-w-5xl px-8 print:hidden">
            <p className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
                {children}
            </p>
        </div>
    );
}
