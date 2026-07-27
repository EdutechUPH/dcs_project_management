// src/app/workload/page.tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import WorkloadList from './WorkloadList';
import { redirect } from 'next/navigation';
import { type Profile, type Video, type Assignment, type Project } from '@/lib/types';
import { getYearScope, outOfYearTerm } from '@/lib/academic-year';
import { cn } from '@/lib/utils';

export const revalidate = 0;

export default async function WorkloadPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const supabase = await createClient();
  const resolved = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const [{ data: profiles, error }, yearScope] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        *,
        project_assignments (
          id,
          role,
          created_at,
          projects (
            *,
            lecturers ( name ),
            videos ( * )
          )
        )
      `)
      .order('full_name'),
    getYearScope(supabase),
  ]);

  if (error) {
    console.error("Error fetching workload page data:", error);
    return <p>Error loading data. Please check the server console.</p>;
  }

  // --- SCOPE ---
  // Workload answers "what is on people's plates", so it follows the dashboard's rule
  // rather than the analytics one: the active year PLUS anything still running from an
  // earlier year. Someone finishing a 2025/2026 project is genuinely busy this week, and
  // a capacity view that hid that work would cheerfully send them more.
  //
  // `?year=all` opts out; `?year=<id>` picks one. Absent means the active year.
  const requestedYear = resolved.year ?? null;
  const showingAllYears = requestedYear === 'all';
  const pickedYear = requestedYear && requestedYear !== 'all'
    ? yearScope.years.find(y => String(y.id) === requestedYear) ?? null
    : null;

  // A specific year that isn't the active one is read strictly — you asked for that year,
  // so carry-over from before it is not what you meant.
  const scopedTermIds = pickedYear
    ? new Set(
      Object.entries(yearScope.termYearName)
        .filter(([, name]) => name === pickedYear.name)
        .map(([id]) => Number(id))
    )
    : null;

  // Only an explicitly picked year narrows the list. On the default view every live
  // assignment is shown whatever term it is for — a person recording a 1262 course during
  // 1252 is busy now, and a capacity view that hid that would cheerfully send them more.
  // Out-of-year work is labelled on the row instead.
  const inScope = (project: Project) =>
    scopedTermIds ? scopedTermIds.has(Number(project.term_id)) : true;

  const usingDefaultScope = !showingAllYears && !pickedYear && yearScope.active != null;

  // Process the data to only include members with ongoing projects
  const workloadData = (profiles as Profile[])?.map(profile => {
    const ongoingProjects = (profile.project_assignments ?? [])
      // ✅ type guard ensures projects is not undefined
      .filter(
        (assignment): assignment is Assignment & { projects: Project } =>
          Boolean(assignment.projects)
      )
      .map(assignment => ({
        assignment_id: assignment.id,
        role: assignment.role,
        assigned_at: assignment.created_at,
        projects: {
          ...assignment.projects,
          // Labelled for the same reason as on the dashboard: out-of-year work still
          // occupies someone, and whoever is balancing the team should see at a glance
          // whether it is a term slipping or a head start on one still to come.
          outOfYearTerm: usingDefaultScope
            ? outOfYearTerm(assignment.projects, yearScope)
            : null,
        },
      }))
      .filter(item => {
        const pStatus = item.projects.status || 'Active';
        const isNotDone = (item.projects.videos?.length ?? 0) === 0 || item.projects.videos?.some((v: Video) => v.status !== 'Done');
        return !['Done', 'Pending', 'Cancelled'].includes(pStatus) && isNotDone && inScope(item.projects);
      });

    return {
      ...profile,
      ongoing_projects: ongoingProjects,
    };
  }).filter(member => member.ongoing_projects.length > 0);

  const scopeName = showingAllYears
    ? 'All years'
    : pickedYear?.name ?? yearScope.active?.name ?? 'All years';

  const behindCount = (workloadData ?? []).reduce(
    (acc, m) => acc + m.ongoing_projects.filter(p => p.projects.outOfYearTerm?.direction === 'behind').length,
    0
  );

  // Plain links rather than a client-side control: this is one value in the URL, and a
  // server-rendered set of options keeps the page free of client JavaScript.
  const yearOptions = [
    ...yearScope.years.map(y => ({
      key: String(y.id),
      label: y.is_active ? `${y.name} (active)` : y.name,
      href: y.is_active ? '/workload' : `/workload?year=${y.id}`,
      current: y.is_active ? requestedYear == null : requestedYear === String(y.id),
    })),
    { key: 'all', label: 'All years', href: '/workload?year=all', current: showingAllYears },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Team Workload</h1>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{scopeName}</span>
            {' · '}
            {workloadData?.length ?? 0} {workloadData?.length === 1 ? 'person' : 'people'} with ongoing assignments
            {behindCount > 0 && (
              <>
                {' · '}
                <span className="text-amber-700">
                  {behindCount} {behindCount === 1 ? 'assignment' : 'assignments'} behind their term
                </span>
              </>
            )}
          </p>
        </div>

        {yearScope.years.length > 0 && (
          <nav className="flex flex-wrap items-center gap-1 rounded-lg bg-gray-100/80 p-1">
            {yearOptions.map(option => (
              <Link
                key={option.key}
                href={option.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  option.current
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="mt-6">
        {(!workloadData || workloadData.length === 0) ? (
          <div className="rounded-lg border bg-white p-6 text-center text-gray-500">
            {showingAllYears || yearScope.active == null
              ? 'No ongoing projects are currently assigned to any team members.'
              : `Nobody has ongoing assignments in ${scopeName}. Choose "All years" to see work from other years.`}
          </div>
        ) : (
          <WorkloadList workloadData={workloadData} />
        )}
      </div>
    </div>
  );
}
