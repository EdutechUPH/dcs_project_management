// src/app/projects/[id]/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'; // We need this for the new version

export async function updateProjectDetails(projectId: number, formData: FormData) {
  const supabase = createClient();
  const projectData = {
    course_name: formData.get('course_name') as string,
    term_id: Number(formData.get('term_id')),
    faculty_id: Number(formData.get('faculty_id')),
    prodi_id: Number(formData.get('prodi_id')),
    lecturer_id: Number(formData.get('lecturer_id')),
    notes: formData.get('notes') as string,
    due_date: formData.get('due_date') as string,
  };
  const { error } = await supabase.from('projects').update(projectData).eq('id', projectId);
  if (error) {
    console.error('Error updating project details:', error);
    return;
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/');
}

export async function addVideoToProject(projectId: number, formData: FormData) {
  const supabase = createClient();
  const title = formData.get('title') as string;
  if (!title) return;
  const newVideo = { project_id: projectId, title: title, status: 'Requested' };
  const { error } = await supabase.from('videos').insert(newVideo);
  if (error) {
    console.error('Error adding video:', error);
    return;
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteVideo(formData: FormData) {
  const supabase = createClient();
  const videoId = formData.get('videoId') as string;
  const projectId = formData.get('projectId') as string;
  if (!videoId || !projectId) return;
  const { error } = await supabase.from('videos').delete().eq('id', videoId);
  if (error) {
    console.error('Error deleting video:', error);
    return;
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function updateVideo(formData: FormData) {
  const supabase = createClient();
  const videoId = formData.get('videoId') as string;
  const projectId = formData.get('projectId') as string;
  if (!videoId || !projectId) return;
  const videoData = {
    title: formData.get('title') as string,
    status: formData.get('status') as string,
    duration_minutes: Number(formData.get('duration_minutes')) || 0,
    duration_seconds: Number(formData.get('duration_seconds')) || 0,
    language: formData.get('language') as string,
    has_english_subtitle: formData.get('has_english_subtitle') === 'on',
    has_indonesian_subtitle: formData.get('has_indonesian_subtitle') === 'on',
    video_link: formData.get('video_link') as string,
  };
  const { error } = await supabase.from('videos').update(videoData).eq('id', videoId);
  if (error) {
    console.error('Error updating video:', error);
    return;
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function assignTeamMember(projectId: number, prevState: any, formData: FormData) {
  const supabase = createClient();
  const team_member_id = Number(formData.get('team_member_id'));
  const role = formData.get('role') as string;
  if (!team_member_id || !role) {
    return { message: 'Please select a member and a role.' };
  }
  const { error } = await supabase.from('project_assignments').insert({
    project_id: projectId, team_member_id, role,
  });
  if (error) {
    console.error('Supabase error assigning member:', error);
    return { message: 'Failed to assign member. Check terminal for details.' };
  }
  revalidatePath(`/projects/${projectId}`);
  return { message: '' };
}

export async function removeTeamMemberAssignment(prevState: any, formData: FormData) {
  const supabase = createClient();
  const assignmentId = formData.get('assignmentId') as string;
  const projectId = formData.get('projectId') as string;
  if (!assignmentId || !projectId) {
    return { message: 'Missing required IDs.' };
  }
  const { error } = await supabase.from('project_assignments').delete().eq('id', assignmentId);
  if (error) {
    console.error('Supabase error removing assignment:', error);
    return { message: 'Failed to remove assignment. Check terminal for details.' };
  }
  revalidatePath(`/projects/${projectId}`);
  return { message: '' };
}

export async function requestFeedback(projectId: number) {
  const supabase = createClient();
  const { data: existing, error: selectError } = await supabase
    .from('feedback_submission')
    .select('submission_uuid')
    .eq('project_id', projectId)
    .maybeSingle();
    
  if (selectError) {
    console.error("Error checking for existing feedback:", selectError);
    return { error: 'Database error.' };
  }

  if (existing) {
    return { uuid: existing.submission_uuid };
  }

  const { data: newSubmission, error: insertError } = await supabase
    .from('feedback_submission')
    .insert({ project_id: projectId })
    .select('submission_uuid')
    .single();

  if (insertError || !newSubmission) {
    console.error("Error creating new feedback submission:", insertError);
    return { error: 'Failed to create feedback link.' };
  }

  revalidatePath(`/projects/${projectId}`);
  return { uuid: newSubmission.submission_uuid };
}