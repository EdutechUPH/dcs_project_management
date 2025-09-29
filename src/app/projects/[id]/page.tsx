// src/app/projects/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EditProjectDetails from './EditProjectDetails';
import VideoList from './VideoList';
import AssignedTeam from './AssignedTeam';
import FeedbackManager from './FeedbackManager';

export const revalidate = 0;

export default async function ProjectDetailPage({ params: { id } }: { params: { id: string } }) {
  const supabase = createClient();
  const projectId = id;
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = user ? await supabase.from('profiles').select('role').eq('id', user.id).single() : { data: null };

  const projectPromise = supabase
    .from('projects')
    .select(`*, lecturers(name), terms(name), prodi(name, faculties(name)), videos(*), project_assignments(*, profiles(full_name)), feedback_submission(submission_uuid, submitted_at)`)
    .eq('id', projectId)
    .order('created_at', { foreignTable: 'videos', ascending: true })
    .single();

  const profilesPromise = supabase.from('profiles').select('*').order('full_name');
  const termsPromise = supabase.from('terms').select('*');
  const facultiesPromise = supabase.from('faculties').select('*');
  const prodiPromise = supabase.from('prodi').select('*');
  const workloadPromise = supabase.rpc('get_team_workload');

  const [
    { data: project, error },
    { data: profiles },
    { data: terms },
    { data: faculties },
    { data: prodi },
    { data: workloadData }
  ] = await Promise.all([
    projectPromise,
    profilesPromise,
    termsPromise,
    facultiesPromise,
    prodiPromise,
    workloadPromise
  ]);

  if (error || !project) {
    console.error("Error fetching project details:", error);
    notFound();
  }

  const masterLists = { 
    terms: terms || [], 
    faculties: faculties || [], 
    prodi: prodi || [] 
  };
  const feedbackSubmission = project.feedback_submission || null;

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
            <EditProjectDetails 
              project={project as any} 
              masterLists={masterLists} 
              userRole={userProfile?.role || ''} 
            />
          </div>
          <VideoList 
            videos={project.videos} 
            projectId={project.id} 
            profiles={profiles || []}
            assignments={project.project_assignments || []} 
          />
        </div>
        
        <div className="lg:col-span-1 space-y-8">
          <AssignedTeam 
            projectId={project.id}
            assignments={project.project_assignments}
            profiles={profiles || []}
            workloadData={workloadData || []}
          />
          <FeedbackManager projectId={project.id} feedbackSubmission={feedbackSubmission} />
        </div>
      </div>
    </div>
  );
}