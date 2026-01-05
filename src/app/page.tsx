import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import FilterControls from './FilterControls';
import { type Project, type Video, type Profile } from '@/lib/types';
import { DataTable } from './projects/data-table/data-table';
import { columns } from './projects/data-table/columns';
import { DashboardStats } from './DashboardStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';

export const revalidate = 0;

export default async function HomePage({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const supabase = await createClient();

  // Pagination Logic
  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = 10;
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  let query = supabase
    .from('projects')
    .select('*, due_date, lecturers(name), prodi(name), videos(*), project_assignments(*, profiles(full_name)), feedback_submission(submitted_at)', { count: 'exact' });

  // 1. Text Search
  if (searchParams.query) {
    query = query.ilike('course_name', `%${searchParams.query}%`);
  }

  // 2. Dropdown Filters
  if (searchParams.faculty) {
    query = query.eq('faculty_id', searchParams.faculty);
  }
  if (searchParams.term) {
    query = query.eq('term_id', searchParams.term);
  }
  if (searchParams.teamMember) {
    query = query.eq('project_assignments.profile_id', searchParams.teamMember);
  }

  // Apply Range for Pagination
  const { data: projects, error, count } = await query
    .order('due_date', { ascending: true })
    .range(from, to);

  // --- NEW: Global Stats Query (Lightweight) ---
  // We fetch ALL projects but ONLY the fields needed for stats (id, due_date, videos status)
  // This is much faster than fetching full data and allows accurate global counts.
  const { data: allProjectsForStats } = await supabase
    .from('projects')
    .select('id, due_date, videos(status)');

  // Calculate Global Stats
  const globalIncomplete = (allProjectsForStats as Project[])?.filter(p =>
    p.videos.some((v: Video) => v.status !== 'Done') || p.videos.length === 0
  ) || [];

  const globalComplete = (allProjectsForStats as Project[])?.filter(p =>
    p.videos.length > 0 && p.videos.every((v: Video) => v.status === 'Done')
  ) || [];

  const globalOverdue = globalIncomplete.filter(p =>
    p.due_date && new Date(p.due_date) < new Date()
  ).length;

  const globalWipVideos = globalIncomplete.reduce((acc, p) =>
    acc + p.videos.filter((v: Video) => v.status !== 'Done').length, 0
  );

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

  // Client-side status filtering
  // Note: With server-side pagination, this filter applies ONLY to the current page's results.
  const statusFilteredProjects = (projects as Project[])?.filter(project => {
    if (searchParams.status === 'complete') {
      return project.videos.length > 0 && project.videos.every((v: Video) => v.status === 'Done');
    }
    if (searchParams.status === 'incomplete') {
      return project.videos.some((v: Video) => v.status !== 'Done') || project.videos.length === 0;
    }
    return true;
  }) || [];

  const incompleteProjects = statusFilteredProjects.filter(p => p.videos.some((v: Video) => v.status !== 'Done') || p.videos.length === 0);
  const completeProjects = statusFilteredProjects.filter(p => p.videos.length > 0 && p.videos.every((v: Video) => v.status === 'Done'));

  return (
    <div className="p-8">
      {/* 
         Stats Row - NOW ACCURATE via lightweight global query 
      */}
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

      <Tabs defaultValue="ongoing" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-gray-100 p-1">
          <TabsTrigger
            value="ongoing"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all hover:bg-gray-200"
          >
            Ongoing Projects ({incompleteProjects.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all hover:bg-gray-200"
          >
            Completed Projects ({completeProjects.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ongoing" className="mt-4">
          <DataTable columns={columns} data={incompleteProjects} />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <DataTable columns={columns} data={completeProjects} />
        </TabsContent>
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
