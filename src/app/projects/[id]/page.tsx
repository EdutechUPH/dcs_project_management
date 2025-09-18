// src/app/projects/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'; // This is the corrected import
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EditProjectDetails from './EditProjectDetails';
import VideoList from './VideoList';
import AssignedTeam from './AssignedTeam';
import FeedbackManager from './FeedbackManager';

export const revalidate = 0;

export default async function ProjectDetailPage({ params: { id } }: { params: { id: string } }) {
  const supabase = createClient(); // Now this function will be correctly imported
  const projectId = id;

  const projectPromise = supabase
    .from('projects')
    .select(`*, lecturers(name), terms(name), prodi(name, faculties(name)), videos(*), project_assignments(*, team_members(name)), feedback_submission(submission_uuid)`)
    .eq('id', projectId)
    .single();

  const teamMembersPromise = supabase.from('team_members').select('*').order('name');
  const termsPromise = supabase.from('terms').select('*');
  const facultiesPromise = supabase.from('faculties').select('*');
  const prodiPromise = supabase.from('prodi').select('*');
  const workloadPromise = supabase.rpc('get_team_workload');

  const [
    { data: project, error },
    { data: teamMembers },
    { data: terms },
    { data: faculties },
    { data: prodi },
    { data: workloadData }
  ] = await Promise.all([projectPromise, teamMembersPromise, termsPromise, facultiesPromise, prodiPromise, workloadPromise]);

  if (error || !project) {
    notFound();
  }

  const masterLists = { terms: terms || [], faculties: faculties || [], prodi: prodi || [] };
  const feedbackUuid = project.feedback_submission?.submission_uuid || null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-600 hover:underline">← Back to Dashboard</Link>
        <h1 className="text-4xl font-bold mt-2">{project.course_name}</h1>
        <p className="text-lg text-gray-500">A project for {project.lecturers?.name}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 border rounded-lg bg-white">
            <EditProjectDetails project={project as any} masterLists={masterLists} />
          </div>
          <VideoList videos={project.videos} projectId={project.id} />
        </div>
        
        <div className="lg:col-span-1 space-y-8">
          <AssignedTeam 
            projectId={project.id}
            assignments={project.project_assignments}
            teamMembers={teamMembers || []}
            workloadData={workloadData || []}
          />
          <FeedbackManager projectId={project.id} initialUuid={feedbackUuid} />
        </div>
      </div>
    </div>
  );
}