// src/app/my-projects/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { type Project, type Video } from '@/lib/types';
import { DataTable } from '@/app/projects/data-table/data-table';
import { columns } from '@/app/projects/data-table/columns';

export const revalidate = 0;

export default async function MyProjectsPage() {
  const supabase = await createClient();

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

      <div className="space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">My Ongoing Projects</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              {incompleteProjects.length}
            </span>
          </div>
          <DataTable columns={columns} data={incompleteProjects} />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Completed Projects</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              {completeProjects.length}
            </span>
          </div>
          <DataTable columns={columns} data={completeProjects} />
        </section>
      </div>
    </div>
  );
}