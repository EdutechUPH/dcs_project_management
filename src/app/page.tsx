import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import FilterControls from './FilterControls';
import { type Project, type Video } from '@/lib/types';
import { DataTable } from './projects/data-table/data-table';
import { columns } from './projects/data-table/columns';
import { DashboardStats } from './DashboardStats';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Removed Content, handled by params
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';

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
  const statusFilter = resolvedSearchParams.status || 'ongoing'; // 'ongoing' | 'completed' | 'all' (optional)

  // --- EFFICIENT STATS FETCHING (RPC or Separate Count Queries) ---
  // Instead of fetching ALL data, we'll fetch just what we need for the stats cards.
  // Note: For a true production scale, use an RPC function like `get_dashboard_stats()`.
  // Here we will use a "lightweight" select that fetches specific columns for ALL rows to calculate stats client-side (still heavy for 10k+ rows but better than `select *`).
  // Ideally: supabase.rpc('get_project_stats')
  const { data: allStatsData } = await supabase
    .from('projects')
    .select('id, due_date, videos(status)');

  const globalIncomplete = (allStatsData as Project[])?.filter(p =>
    p.videos.some((v: Video) => v.status !== 'Done') || p.videos.length === 0
  ) || [];

  const globalComplete = (allStatsData as Project[])?.filter(p =>
    p.videos.length > 0 && p.videos.every((v: Video) => v.status === 'Done')
  ) || [];

  const globalOverdue = globalIncomplete.filter(p =>
    p.due_date && new Date(p.due_date) < new Date()
  ).length;

  const globalWipVideos = globalIncomplete.reduce((acc, p) =>
    acc + p.videos.filter((v: Video) => v.status !== 'Done').length, 0
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

  // 3. Status Filtering (Server-Side)
  // This is tricky because "status" is derived from the `videos` relation.
  // Supabase filters generally apply to the top-level table.
  // We can't easily say "where all videos are done" in a simple PostgREST query on the parent.
  // However, we can use the `!inner` trick to filter by children, but "ALL done" is hard.
  // A common workaround without RPC is to fetch more and filter in memory, OR use Client-Side Filtering as before (but problematic for pagination).
  //
  // BEST FIX (without changing schema): Use the "lightweight" stats data to get IDs of projects that match the status, then filter by those IDs!
  let validProjectIds: number[] = [];
  if (statusFilter === 'completed') {
    validProjectIds = globalComplete.map(p => p.id);
  } else {
    // ongoing
    validProjectIds = globalIncomplete.map(p => p.id);
  }

  // Apply ID filter
  if (validProjectIds.length > 0) {
    query = query.in('id', validProjectIds);
  } else {
    // If no projects match the status, ensure we get 0 results
    query = query.eq('id', -1);
  }


  // Apply Range for Pagination
  const { data: projects, error, count } = await query
    .order('due_date', { ascending: true })
    .range(from, to);

  // Calculate Total Pages
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

      <Tabs defaultValue={statusFilter} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-gray-100/80 backdrop-blur-sm p-1 rounded-full border border-gray-200 shadow-inner">
          <Link href="?status=ongoing" scroll={false} className="w-full">
            <TabsTrigger
              value="ongoing"
              className="w-full rounded-full data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all hover:bg-white/60 font-medium"
            >
              Ongoing Projects ({globalIncomplete.length})
            </TabsTrigger>
          </Link>
          <Link href="?status=completed" scroll={false} className="w-full">
            <TabsTrigger
              value="completed"
              className="w-full rounded-full data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm transition-all hover:bg-white/60 font-medium"
            >
              Completed Projects ({globalComplete.length})
            </TabsTrigger>
          </Link>
        </TabsList>

        <div className="mt-6">
          <DataTable columns={columns} data={projects as Project[]} />
        </div>
      </Tabs>

      <div className="mt-8">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={currentPage < totalPages}
          hasPrevPage={currentPage > 1}
        />
      </div>
    </div>
  );
}
