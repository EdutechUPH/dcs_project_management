// src/app/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ProjectList from './ProjectList';
import FilterControls from './FilterControls';

export const revalidate = 0;

export default async function HomePage({ searchParams }: { searchParams: { [key: string]: string | undefined }}) {
  const supabase = createClient();

  let query = supabase
    .from('projects')
    .select(`
      *, due_date, lecturers(name), prodi(name), videos(*), 
      project_assignments(*, profiles(full_name)), 
      feedback_submission(submitted_at)
    `);

  // Apply filters from the URL
  if (searchParams.faculty) {
    query = query.eq('faculty_id', searchParams.faculty);
  }
  if (searchParams.term) {
    query = query.eq('term_id', searchParams.term);
  }
  if (searchParams.teamMember) {
    query = query.eq('project_assignments.profile_id', searchParams.teamMember);
  }

  const { data: projects, error } = await query.order('due_date', { ascending: true });

  // Fetch data for the filter dropdowns
  const { data: faculties } = await supabase.from('faculties').select('id, name');
  const { data: terms } = await supabase.from('terms').select('id, name');
  // Changed to fetch from profiles
  const { data: teamMembers } = await supabase.from('profiles').select('id, full_name').order('full_name');

  if (error) {
    console.error("Dashboard fetch error:", error);
    return <p>Error fetching projects: {error.message}</p>;
  }
  
  // --- THIS IS THE CORRECTED LOGIC ---
  // First, filter by status if the URL param exists
  const statusFilteredProjects = projects?.filter(project => {
    if (searchParams.status === 'complete') {
      return project.videos.length > 0 && project.videos.every(v => v.status === 'Done');
    }
    if (searchParams.status === 'incomplete') {
      return project.videos.some(v => v.status !== 'Done') || project.videos.length === 0;
    }
    return true; // If no status filter, return all
  }) || [];

  // Then, split the result into two lists for display
  const incompleteProjects = statusFilteredProjects.filter(p => p.videos.some(v => v.status !== 'Done') || p.videos.length === 0);
  const completeProjects = statusFilteredProjects.filter(p => p.videos.length > 0 && p.videos.every(v => v.status === 'Done'));

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects Dashboard</h1>
        <Link href="/projects/new" className="bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700">New Project Request</Link>
      </div>

      <FilterControls 
        faculties={faculties ?? []} 
        terms={terms ?? []} 
        teamMembers={teamMembers?.map(p => ({ id: p.id, name: p.full_name })) ?? []} 
      />

      {/* Incomplete Projects Table */}
      <h2 className="text-2xl font-semibold mb-4">Incomplete Projects</h2>
      <div className="border rounded-lg overflow-x-auto mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project / Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Study Program</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Editor/Videographer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            </tr>
          </thead>
          <ProjectList projects={incompleteProjects} />
        </table>
      </div>

      {/* Complete Projects Table */}
      <h2 className="text-2xl font-semibold mb-4">Completed Projects</h2>
      <div className="border rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project / Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Study Program</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Editor/Videographer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            </tr>
          </thead>
          <ProjectList projects={completeProjects} />
        </table>
      </div>
    </div>
  );
}