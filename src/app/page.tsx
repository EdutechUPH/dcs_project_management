import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import FilterControls from './FilterControls';
import { type Project, type Video } from '@/lib/types';
import { DataTable } from './projects/data-table/data-table';
import { columns } from './projects/data-table/columns';
import { DashboardStats } from './DashboardStats';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import StatusTabsClient from './StatusTabsClient';

export const revalidate = 0;

export default async function HomePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;

  // Pagination Logic
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const itemsPerPage = 10;
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  // Status Filter Logic (Default to 'ongoing')
  const statusFilter = resolvedSearchParams.status || 'ongoing';

  // --- STATS QUERY: respects active dropdown filters (faculty, term, team member) ---
  // For team member, first resolve project IDs via the assignments table
  let statsTeamMemberIds: number[] | null = null;
  if (resolvedSearchParams.teamMember) {
    const { data: assignments } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('profile_id', resolvedSearchParams.teamMember);
    statsTeamMemberIds = (assignments || []).map((a: any) => a.project_id);
  }

  let statsQuery = supabase
    .from('projects')
    .select('id, due_date, status, videos(status), feedback_submission(submitted_at)');

  if (resolvedSearchParams.faculty) {
    statsQuery = statsQuery.eq('faculty_id', resolvedSearchParams.faculty);
  }
  if (resolvedSearchParams.term) {
    statsQuery = statsQuery.eq('term_id', resolvedSearchParams.term);
  }
  if (statsTeamMemberIds !== null) {
    statsQuery = statsQuery.in('id', statsTeamMemberIds.length > 0 ? statsTeamMemberIds : [-1]);
  }

  const { data: allStatsData } = await statsQuery;

  // Function to determine if a project is considered completed
  const isCompleted = (p: any) => {
    const fb = Array.isArray(p.feedback_submission) ? p.feedback_submission[0] : p.feedback_submission;
    const hasFeedback = fb && fb.submitted_at;
    return p.status === 'Done' || hasFeedback;
  };

  // Function to determine if a project is considered active
  const isActiveStatus = (p: any) => {
    if (isCompleted(p)) return false;
    return !['Pending', 'Cancelled'].includes(p.status || 'Active');
  };

  const allProjects = (allStatsData || []) as any[];

  const globalIncomplete = allProjects.filter(p => isActiveStatus(p));
  const globalComplete = allProjects.filter(p => isCompleted(p));
  const globalPending = allProjects.filter(p => !isCompleted(p) && p.status === 'Pending');
  const globalCancelled = allProjects.filter(p => !isCompleted(p) && p.status === 'Cancelled');

  const globalOverdue = globalIncomplete.filter(p =>
    p.due_date && new Date(p.due_date) < new Date()
  ).length;

  const globalWipVideos = globalIncomplete.reduce((acc, p) =>
    acc + (p.videos || []).filter((v: Video) => v.status !== 'Done').length, 0
  );


  // --- MAIN DATA QUERY ---
  let query = supabase
    .from('projects')
    .select('*, created_at, due_date, lecturers(name), prodi(name), videos(*), project_assignments(*, profiles(full_name)), feedback_submission(submitted_at)', { count: 'exact' });

  // 1. Text Search
  if (resolvedSearchParams.query) {
    query = query.ilike('course_name', `%${resolvedSearchParams.query}%`);
  }

  // 2. Dropdown Filters
  if (resolvedSearchParams.faculty) {
    query = query.eq('faculty_id', resolvedSearchParams.faculty);
  }
  if (resolvedSearchParams.term) {
    query = query.eq('term_id', resolvedSearchParams.term);
  }
  if (resolvedSearchParams.teamMember) {
    query = query.eq('project_assignments.profile_id', resolvedSearchParams.teamMember);
  }

  // 3. Status Filtering using pre-computed IDs
  let validProjectIds: number[] = [];
  if (statusFilter === 'completed') {
    validProjectIds = globalComplete.map(p => p.id);
  } else if (statusFilter === 'pending') {
    validProjectIds = globalPending.map(p => p.id);
  } else if (statusFilter === 'cancelled') {
    validProjectIds = globalCancelled.map(p => p.id);
  } else {
    validProjectIds = globalIncomplete.map(p => p.id);
  }

  if (validProjectIds.length > 0) {
    query = query.in('id', validProjectIds);
  } else {
    query = query.eq('id', -1);
  }

  // Apply Range for Pagination
  const { data: projects, error, count } = await query
    .order('due_date', { ascending: true })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / itemsPerPage);

  // Fetch filter options
  const { data: faculties } = await supabase.from('faculties').select('id, name');
  const { data: terms } = await supabase.from('terms').select('id, name');
  const { data: profiles } = await supabase.from('profiles').select('id, full_name');

  if (error) {
    console.error("Dashboard fetch error:", error);
    return <p>Error fetching projects: {error.message}</p>;
  }

  return (
    <div className="p-8">
      <DashboardStats
        totalActive={globalIncomplete.length}
        videosInProduction={globalWipVideos}
        overdueProjects={globalOverdue}
        totalCompleted={globalComplete.length}
      />

      <div className="flex justify-between items-center mb-6 mt-8 gap-4">
        <h1 className="text-3xl font-bold">Projects Dashboard</h1>
        <div className="flex items-center gap-4">
          <SearchBar />
          <Link href="/projects/new" className="bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700 whitespace-nowrap">New Project Request</Link>
        </div>
      </div>

      <FilterControls
        faculties={faculties ?? []}
        terms={terms ?? []}
        teamMembers={profiles?.map(p => ({ id: p.id, name: p.full_name })) ?? []}
      />

      <StatusTabsClient
        statusFilter={statusFilter}
        counts={{
          ongoing: globalIncomplete.length,
          completed: globalComplete.length,
          pending: globalPending.length,
          cancelled: globalCancelled.length,
        }}
      >
        <DataTable columns={columns} data={projects as Project[]} />
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={currentPage < totalPages}
            hasPrevPage={currentPage > 1}
          />
        </div>
      </StatusTabsClient>
    </div>
  );
}
