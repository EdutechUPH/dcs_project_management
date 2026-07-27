// src/app/admin/academic-years/page.tsx
//
// Years AND terms live on this one screen. Terms used to have their own page with a bare
// "add term" box, which made it possible — easy, in fact — to create a term with no year.
// Such a term sits outside every scope, so its projects silently disappear from the
// dashboard with nothing on screen to explain why. Creating a term is now only reachable
// from inside a year.
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AcademicYearManager, { type YearRow } from './AcademicYearManager';
import OrphanTerms, { type OrphanTerm } from './OrphanTerms';

export const revalidate = 0;

type ProjectRow = {
    term_id: number | null;
    status: string | null;
    videos: { status: string }[] | null;
    feedback_submission: { submitted_at: string | null } | { submitted_at: string | null }[] | null;
};

export default async function AcademicYearsPage() {
    const supabase = await createClient();

    const [{ data: years }, { data: terms }, { data: projects }] = await Promise.all([
        supabase.from('academic_years').select('id, name, code, is_active').order('code'),
        supabase.from('terms').select('id, name, academic_year_id').order('name'),
        supabase.from('projects').select('term_id, status, videos(status), feedback_submission(submitted_at)'),
    ]);

    // The migration may not have been applied in this environment. Say so rather than
    // rendering an empty manager that looks like a data problem.
    if (!years) {
        return (
            <div>
                <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">← Back to Admin</Link>
                <h1 className="mt-2 text-3xl font-bold">Academic Years &amp; Terms</h1>
                <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    The <code className="rounded bg-white/60 px-1">academic_years</code> table does not exist yet.
                    Run <code className="rounded bg-white/60 px-1">db_schema_academic_years.sql</code> in the Supabase
                    SQL Editor, then reload this page. Until then every page shows all-time figures.
                </p>
            </div>
        );
    }

    // Same completion rule as everywhere else (AI_README §9): Done, or a feedback form exists.
    const isCompleted = (p: ProjectRow) => {
        const fb = Array.isArray(p.feedback_submission) ? p.feedback_submission[0] : p.feedback_submission;
        return p.status === 'Done' || Boolean(fb?.submitted_at);
    };
    const isLive = (p: ProjectRow) =>
        !isCompleted(p) && !['Pending', 'Cancelled'].includes(p.status || 'Active');

    const projectsPerTerm = new Map<number, number>();
    const statsPerYear = new Map<number, { projects: number; live: number; liveVideos: number }>();
    const yearOfTerm = new Map<number, number>();
    for (const term of terms ?? []) {
        if (term.academic_year_id != null) yearOfTerm.set(term.id, term.academic_year_id);
    }

    for (const project of (projects ?? []) as ProjectRow[]) {
        if (project.term_id == null) continue;
        projectsPerTerm.set(project.term_id, (projectsPerTerm.get(project.term_id) ?? 0) + 1);

        const yearId = yearOfTerm.get(project.term_id);
        if (yearId == null) continue;
        const row = statsPerYear.get(yearId) ?? { projects: 0, live: 0, liveVideos: 0 };
        row.projects++;
        if (isLive(project)) {
            row.live++;
            row.liveVideos += (project.videos ?? []).filter(v => v.status !== 'Done').length;
        }
        statsPerYear.set(yearId, row);
    }

    // Codes are fixed-width numeric strings ('125' < '126'), so lexical order is
    // chronological order without parsing — the same comparison getYearScope() uses.
    const activeCode = years.find(y => y.is_active)?.code ?? null;

    const yearRows: YearRow[] = years.map(y => {
        const s = statsPerYear.get(y.id) ?? { projects: 0, live: 0, liveVideos: 0 };
        return {
            id: y.id,
            name: y.name,
            code: y.code,
            is_active: y.is_active,
            relation: activeCode == null || y.is_active
                ? 'active'
                : y.code < activeCode ? 'earlier' : 'later',
            terms: (terms ?? [])
                .filter(t => t.academic_year_id === y.id)
                .map(t => ({
                    id: t.id,
                    name: t.name,
                    academic_year_id: t.academic_year_id,
                    projectCount: projectsPerTerm.get(t.id) ?? 0,
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            projectCount: s.projects,
            liveProjectCount: s.live,
            liveVideoCount: s.liveVideos,
        };
    });

    // Terms predating the "always inside a year" rule. Normally an empty list, in which
    // case the section renders nothing at all rather than an empty frame.
    const orphans: OrphanTerm[] = (terms ?? [])
        .filter(t => t.academic_year_id == null)
        .map(t => ({ id: t.id, name: t.name, projectCount: projectsPerTerm.get(t.id) ?? 0 }));

    return (
        <div className="space-y-10">
            <div>
                <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">← Back to Admin</Link>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                    Academic Years &amp; Terms
                </h1>
                <p className="mt-1.5 text-sm text-gray-500">
                    Terms are created inside the year they belong to, and the active year is what the
                    dashboard, analytics and workload report on by default.
                </p>
            </div>

            <OrphanTerms terms={orphans} years={years.map(y => ({ id: y.id, name: y.name }))} />

            <AcademicYearManager years={yearRows} />
        </div>
    );
}
