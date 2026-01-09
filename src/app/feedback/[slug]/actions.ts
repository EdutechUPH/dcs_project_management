// src/app/feedback/[uuid]/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type FormState = {
  message: string;
};

export async function submitFeedback(submissionUuid: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const submissionData = {
    rating_pre_production: Number(formData.get('rating_pre_production')),
    rating_communication: Number(formData.get('rating_communication')),
    rating_quality: Number(formData.get('rating_quality')),
    rating_timeliness: Number(formData.get('rating_timeliness')),
    rating_final_product: Number(formData.get('rating_final_product')),
    rating_recommendation: Number(formData.get('rating_recommendation')),
    needs_improvement: formData.get('needs_improvement') === 'Yes',
    improvement_aspects: formData.get('improvement_aspects') as string,
    overall_experience_comments: formData.get('overall_experience_comments') as string,
    submitted_at: new Date().toISOString(),
  };

  const ratings = Object.values(submissionData).slice(0, 6);
  if (ratings.some(r => isNaN(r as number) || r === 0)) {
    return { message: 'Please answer all rating questions (1-5).' };
  }

  const { data, error } = await supabase
    .from('feedback_submission')
    .update(submissionData)
    .eq('submission_uuid', submissionUuid)
    // THE FIX IS HERE: We select the project_id directly
    .select('project_id')
    .single();

  if (error || !data) {
    console.error('Error submitting feedback:', error);
    return { message: 'Database Error: Could not submit feedback.' };
  }

  // We can now access the project_id much more simply
  const projectId = data.project_id;
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }

  redirect('/feedback/thank-you');
}

export async function externalApproveVideo(uuid: string, videoId: number) {
  const supabase = await createClient();

  // Validate ownership via UUID
  const { data: submission } = await supabase.from('feedback_submission').select('project_id').eq('submission_uuid', uuid).single();
  if (!submission) return false;

  const { error } = await supabase
    .from('videos')
    .update({ status: 'Done', revision_notes: null })
    .eq('id', videoId)
    .eq('project_id', submission.project_id); // Ensure video belongs to this project

  if (error) {
    console.error("Error approving video:", error);
    return false;
  }
  revalidatePath(`/feedback/${uuid}`);
  revalidatePath(`/projects/${submission.project_id}`);
  return true;
}

export async function externalRequestRevision(uuid: string, videoId: number, notes: string) {
  const supabase = await createClient();

  // Validate ownership via UUID
  const { data: submission } = await supabase.from('feedback_submission').select('project_id').eq('submission_uuid', uuid).single();
  if (!submission) return false;

  // Create log entry
  await supabase.from('video_feedback_log').insert({
    video_id: videoId,
    feedback_text: notes,
    status_context: 'Revision Requested'
  });

  const { error } = await supabase
    .from('videos')
    .update({
      status: 'Video Editing', // Changed to 'Video Editing' so it appears in editor's dashboard
      revision_notes: notes
    })
    .eq('id', videoId)
    .eq('project_id', submission.project_id);

  if (error) {
    console.error("Error requesting revision:", error);
    return false;
  }
  revalidatePath(`/feedback/${uuid}`);
  revalidatePath(`/projects/${submission.project_id}`);
  return true;
}