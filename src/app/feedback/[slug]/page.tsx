// src/app/feedback/[uuid]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import FeedbackDashboard from './FeedbackDashboard';
import { type Project } from '@/lib/types';

export const revalidate = 0; // Ensure fresh data for approval status

export default async function FeedbackPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  // Await params if it's a promise (Next.js 15+), though in 14 it's an object. 
  // Good practice to be safe or just log it.
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  console.log('[DEBUG] Feedback Page - Slug:', slug);

  let submissionUuid = '';
  let projectId = null;

  // Try finding by slug first 

  const { data: submissionBySlug, error: slugError } = await supabase
    .from('feedback_submission')
    .select('project_id, submission_uuid')
    .eq('slug', slug)
    .maybeSingle();

  console.log('[DEBUG] Lookup by slug result:', { submissionBySlug, slugError });

  if (submissionBySlug) {
    submissionUuid = submissionBySlug.submission_uuid;
    projectId = submissionBySlug.project_id;
  } else {
    // Fallback: try finding by UUID (in case it's a raw UUID from old link)
    const { data: submissionByUuid, error: uuidError } = await supabase
      .from('feedback_submission')
      .select('project_id, submission_uuid')
      .eq('submission_uuid', slug) // 'slug' param might contain the UUID string
      .maybeSingle();

    console.log('[DEBUG] Lookup by UUID result:', { submissionByUuid, uuidError });

    if (submissionByUuid) {
      submissionUuid = submissionByUuid.submission_uuid;
      projectId = submissionByUuid.project_id;
    }
  }

  if (!projectId || !submissionUuid) {
    console.error('[DEBUG] 404 - No submission found for slug:', slug);
    notFound();
  }

  // 2. Fetch the project details (Course Name, Lecturer) + Videos
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(`
      id, 
      course_name, 
      lecturers(name),
      videos(*)
    `)
    .eq('id', projectId) // Use resolved project ID
    .order('created_at', { foreignTable: 'videos', ascending: true })
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Cast strictly to match what the dashboard expects
  // We need to map the nested structure to match the simplified Project type if needed, 
  // but typically Supabase returns nested objects differently.
  // Our 'Project' type in types.ts expects `lecturers: { name: string } | null` which matches this query.

  return (
    <FeedbackDashboard
      project={project as unknown as Project}
      submissionUuid={submissionUuid}
    />
  );
}