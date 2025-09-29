// src/app/workload/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import WorkloadList from './WorkloadList';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function WorkloadPage() {
  const supabase = createClient();

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

  const workloadData = profiles?.map(profile => {
    const ongoingProjects = profile.project_assignments
      .filter(assignment => assignment.projects)
      .map(assignment => ({
        assignment_id: assignment.id, // Pass the unique assignment ID
        role: assignment.role,
        assigned_at: assignment.created_at,
        projects: assignment.projects,
      }))
      .filter(item => item.projects.videos.length === 0 || item.projects.videos.some((v: any) => v.status !== 'Done'));
    
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