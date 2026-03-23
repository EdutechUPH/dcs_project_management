// src/app/projects/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EditProjectDetails from './EditProjectDetails';
import VideoList from './VideoList';
import AssignedTeam from './AssignedTeam';
import FeedbackManager from './FeedbackManager';
import { type Project as ProjectType } from '@/lib/types';

export const revalidate = 0;

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  const projectId = id;

  if (!projectId || projectId === 'undefined' || isNaN(Number(projectId))) {
    console.error("Invalid Project ID:", projectId);
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = user ? await supabase.from('profiles').select('role').eq('id', user.id).single() : { data: null };

  const projectPromise = supabase
    .from('projects')
    .select(`
      *, 
      lecturers(name), 
      terms(name), 
      prodi(name, faculties(name)), 
      videos(*), 
      project_assignments(*, profiles(*)), 
      feedback_submission(*)
    `)
    .eq('id', projectId)
    .order('created_at', { foreignTable: 'videos', ascending: true })
    .single();

  const profilesPromise = supabase.from('profiles').select('*').order('full_name');
  const termsPromise = supabase.from('terms').select('*');
  const facultiesPromise = supabase.from('faculties').select('*');
  const prodiPromise = supabase.from('prodi').select('*');
  
  // Custom workload query bypassing outdated RPC
  const workloadPromise = supabase.from('profiles').select(`
    full_name,
    project_assignments (
      projects ( status, videos ( status ) )
    )
  `);

  const [
    { data: project, error },
    { data: profiles },
    { data: terms },
    { data: faculties },
    { data: prodi },
    { data: rawWorkloadData }
  ] = await Promise.all([
    projectPromise,
    profilesPromise,
    termsPromise,
    facultiesPromise,
    prodiPromise,
    workloadPromise
  ]);

  const workloadData = (rawWorkloadData || []).map((p: any) => {
    let activeVideos = 0;
    p.project_assignments?.forEach((a: any) => {
      const proj = a.projects;
      if (proj && !['Done', 'Pending', 'Cancelled'].includes(proj.status || 'Active')) {
        activeVideos += proj.videos?.filter((v: any) => v.status !== 'Done').length || 0;
      }
    });
    return { member_name: p.full_name, active_videos: activeVideos };
  });

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
              project={project as ProjectType}
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
          <FeedbackManager projectId={project.id} feedbackSubmission={feedbackSubmission} videos={project.videos} />


          {/* Feedback consolidated in FeedbackManager */}
        </div>
      </div>
    </div>
  );
}