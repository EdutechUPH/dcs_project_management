// src/app/workload/page.tsx
import { createClient } from '@/lib/supabase/server';
import WorkloadList from './WorkloadList';
import { redirect } from 'next/navigation';
import { type Profile, type Video, type Assignment, type Project } from '@/lib/types';

export const revalidate = 0;

export default async function WorkloadPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profiles, error } = await supabase
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
    .order('full_name');

  if (error) {
    console.error("Error fetching workload page data:", error);
    return <p>Error loading data. Please check the server console.</p>;
  }

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
        projects: assignment.projects,
      }))
      .filter(item =>
        (item.projects.videos?.length ?? 0) === 0 ||
        item.projects.videos?.some((v: Video) => v.status !== 'Done')
      );

    return {
      ...profile,
      ongoing_projects: ongoingProjects,
    };
  }).filter(member => member.ongoing_projects.length > 0);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Team Workload</h1>

      {(!workloadData || workloadData.length === 0) ? (
        <div className="p-6 border rounded-lg bg-white text-center text-gray-500">
          No active projects are currently assigned to any team members.
        </div>
      ) : (
        <WorkloadList workloadData={workloadData} />
      )}
    </div>
  );
}
