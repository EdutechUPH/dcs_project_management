// src/app/feedback/[uuid]/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Define a specific state for our form
type FormState = {
  message: string;
};

export async function submitFeedback(submissionUuid: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();

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
    .select('projects(id)')
    .single();

  if (error || !data) {
    console.error('Error submitting feedback:', error);
    return { message: 'Database Error: Could not submit feedback.' };
  }
  
  revalidatePath(`/projects/${data.projects?.id}`);
  redirect('/feedback/thank-you');
}