// src/app/my-projects/page.tsx
import { createClient } from '@/lib/supabase/server';
import ProjectList from '@/app/ProjectList';
import { redirect } from 'next/navigation';
import { type Project, type Video } from '@/lib/types';

export const revalidate = 0;

export default async function MyProjectsPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *, due_date, lecturers(name), prodi(name), videos(*), 
      project_assignments!inner(*, profiles(full_name)), 
      feedback_submission(submitted_at)
    `)
    .eq('project_assignments.profile_id', user.id)
    .order('due_date', { ascending: true });

  if (error) {
    console.error("My Projects fetch error:", error);
    return <p>Error fetching your projects: {error.message}</p>;
  }
  
  const incompleteProjects = (projects as Project[])?.filter(p => p.videos.some((v: Video) => v.status !== 'Done') || p.videos.length === 0) || [];
  const completeProjects = (projects as Project[])?.filter(p => p.videos.length > 0 && p.videos.every((v: Video) => v.status === 'Done')) || [];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Projects</h1>
      </div>

      <h2 className="text-2xl font-semibold mb-4">My Incomplete Projects</h2>
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

      <h2 className="text-2xl font-semibold mb-4">My Completed Projects</h2>
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