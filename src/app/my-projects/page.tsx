// src/app/my-projects/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ProjectList from '@/app/ProjectList'; // We can reuse our existing ProjectList component!
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function MyProjectsPage() {
  const supabase = createClient();

  // First, get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login if no user is found (should be handled by middleware, but good practice)
    redirect('/login');
  }

  // Now, fetch only the projects assigned to this user
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *, due_date, lecturers(name), prodi(name), videos(*), 
      project_assignments!inner(*, profiles(full_name)), 
      feedback_submission(submitted_at)
    `)
    // This is the key filter: only get projects where the assignment links to our user's ID
    .eq('project_assignments.profile_id', user.id)
    .order('due_date', { ascending: true });

  if (error) {
    console.error("My Projects fetch error:", error);
    return <p>Error fetching your projects: {error.message}</p>;
  }
  
  // Split projects into incomplete and complete lists, just like the main dashboard
  const incompleteProjects = projects?.filter(p => p.videos.some(v => v.status !== 'Done') || p.videos.length === 0) || [];
  const completeProjects = projects?.filter(p => p.videos.length > 0 && p.videos.every(v => v.status === 'Done')) || [];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Link href="/projects/new" className="bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700">
          New Project Request
        </Link>
      </div>

      {/* Incomplete Projects Table */}
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

      {/* Complete Projects Table */}
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