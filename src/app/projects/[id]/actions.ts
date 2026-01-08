// src/app/projects/[id]/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { MAIN_EDITOR_ROLE } from '@/lib/constants';

// Define a specific type for our form state
type FormState = {
  message?: string | null;
  error?: string | null;
};

/**
 * Updates the main details of a project (course name, lecturer, etc.).
 */
export async function updateProjectDetails(projectId: number, formData: FormData) {
  const supabase = await createClient();
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



/**
 * Adds a new video to an existing project.
 */
export async function addVideoToProject(projectId: number, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get('title') as string;
  if (!title) return;

  const { data: mainEditorAssignment } = await supabase
    .from('project_assignments')
    .select('profile_id')
    .eq('project_id', projectId)
    .eq('role', MAIN_EDITOR_ROLE)
    .limit(1)
    .single();

  // Get current max position to append to the end
  const { data: maxPosData } = await supabase
    .from('videos')
    .select('position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (maxPosData?.position ?? 0) + 1;

  const newVideo = {
    project_id: projectId,
    title: title,
    status: 'Requested',
    main_editor_id: mainEditorAssignment?.profile_id || null,
    position: nextPosition,
  };

  const { error } = await supabase.from('videos').insert(newVideo);
  if (error) {
    console.error('Error adding video:', error);
    return;
  }
  revalidatePath(`/projects/${projectId}`);
}

/**
 * Moves a video up or down in the list.
 */
export async function moveVideo(formData: FormData) {
  const supabase = await createClient();
  const videoId = Number(formData.get('videoId'));
  const projectId = Number(formData.get('projectId'));
  const direction = formData.get('direction') as 'up' | 'down';

  if (!videoId || !projectId || !direction) return;

  // 1. Get the current video's position
  const { data: currentVideo } = await supabase
    .from('videos')
    .select('id, position')
    .eq('id', videoId)
    .single();

  if (!currentVideo) return;

  const currentPos = currentVideo.position;

  // 2. Find the adjacent video to swap with
  let adjacentQuery = supabase
    .from('videos')
    .select('id, position')
    .eq('project_id', projectId);

  if (direction === 'up') {
    // Find item with position LESS than current, closest to it (DESC)
    adjacentQuery = adjacentQuery
      .lt('position', currentPos)
      .order('position', { ascending: false })
      .limit(1);
  } else {
    // Find item with position GREATER than current, closest to it (ASC)
    adjacentQuery = adjacentQuery
      .gt('position', currentPos)
      .order('position', { ascending: true })
      .limit(1);
  }

  const { data: adjacentVideo } = await adjacentQuery.maybeSingle();

  if (adjacentVideo) {
    // 3. Swap positions
    const { error: error1 } = await supabase
      .from('videos')
      .update({ position: adjacentVideo.position })
      .eq('id', currentVideo.id);

    const { error: error2 } = await supabase
      .from('videos')
      .update({ position: currentVideo.position })
      .eq('id', adjacentVideo.id);

    if (error1 || error2) {
      console.error("Error swapping videos:", error1, error2);
    }
  }

  revalidatePath(`/projects/${projectId}`);
}

/**
 * Deletes a video from a project.
 */
export async function deleteVideo(formData: FormData) {
  const supabase = await createClient();
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

/**
 * Updates all details for an individual video.
 */
export async function updateVideo(formData: FormData) {
  const supabase = await createClient();
  const videoId = formData.get('videoId') as string;
  const projectId = formData.get('projectId') as string;
  if (!videoId || !projectId) return;

  const mainEditorId = formData.get('main_editor_id') as string;

  const videoData = {
    title: formData.get('title') as string,
    status: formData.get('status') as string,
    duration_minutes: Number(formData.get('duration_minutes')) || 0,
    duration_seconds: Number(formData.get('duration_seconds')) || 0,
    language: formData.get('language') as string,
    has_english_subtitle: formData.get('has_english_subtitle') === 'on',
    has_indonesian_subtitle: formData.get('has_indonesian_subtitle') === 'on',
    video_link: formData.get('video_link') as string,
    main_editor_id: mainEditorId || null,
  };
  const { error } = await supabase.from('videos').update(videoData).eq('id', videoId);
  if (error) {
    console.error('Error updating video:', error);
    return;
  }
  revalidatePath(`/projects/${projectId}`);
}

/**
 * Updates just the status of a video (for Approval Workflow).
 */
export async function updateVideoStatus(formData: FormData) {
  const supabase = await createClient();
  const videoId = formData.get('videoId') as string;
  const projectId = formData.get('projectId') as string;
  const newStatus = formData.get('newStatus') as string;

  if (!videoId || !projectId || !newStatus) return;

  const { error } = await supabase.from('videos').update({ status: newStatus }).eq('id', videoId);
  if (error) {
    console.error('Error updating status:', error);
    return;
  }
  revalidatePath(`/projects/${projectId}`);
}

/**
 * Assigns a user (from profiles) to a project with a specific role.
 */
export async function assignTeamMember(projectId: number, prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const profile_id = formData.get('profile_id') as string;
  const role = formData.get('role') as string;

  if (!profile_id || !role) {
    return { message: 'Please select a member and a role.' };
  }

  const { error: assignmentError } = await supabase.from('project_assignments').insert({
    project_id: projectId,
    profile_id,
    role,
  });

  if (assignmentError) {
    console.error('Error assigning team member:', assignmentError);
    return { message: 'Failed to assign member. Check terminal for details.' };
  }

  if (role === MAIN_EDITOR_ROLE) {
    const { error: updateVideosError } = await supabase
      .from('videos')
      .update({ main_editor_id: profile_id })
      .eq('project_id', projectId)
      .is('main_editor_id', null);

    if (updateVideosError) {
      console.error('Error auto-assigning main editor to videos:', updateVideosError);
    }
  }

  revalidatePath(`/projects/${projectId}`);
  return { message: '' };
}

/**
 * Removes a team member's assignment from a project.
 */
export async function removeTeamMemberAssignment(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const assignmentId = formData.get('assignmentId') as string;
  const projectId = formData.get('projectId') as string;
  if (!assignmentId || !projectId) return { message: 'Missing required IDs.' };

  const { error } = await supabase.from('project_assignments').delete().eq('id', assignmentId);
  if (error) {
    console.error('Supabase error removing assignment:', error);
    return { message: 'Failed to remove assignment. Check terminal for details.' };
  }
  revalidatePath(`/projects/${projectId}`);
  return { message: '' };
}

/**
 * Generates a feedback link for a project.
 */
export async function requestFeedback(projectId: number) {
  const supabase = await createClient();
  const { data: existing, error: selectError } = await supabase
    .from('feedback_submission')
    .select('submission_uuid, slug')
    .eq('project_id', projectId)
    .maybeSingle();

  if (selectError) {
    console.error("Error checking for existing feedback:", selectError);
    return { error: 'Database error.' };
  }
  if (existing) {
    return {
      uuid: existing.submission_uuid,
      slug: existing.slug
    };
  }

  // Generate readable slug: "Course-Name-RandomChars"
  // Generate readable slug: "course-name-randomchars"
  const { data: project } = await supabase.from('projects').select('course_name').eq('id', projectId).single();

  const courseName = project?.course_name
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '')     // Trim leading/trailing hyphens
    .slice(0, 40) || 'project';

  const randomChars = Math.random().toString(36).substring(2, 7); // lowercase random chars
  const newSlug = `${courseName}-${randomChars}`;

  const { data: newSubmission, error: insertError } = await supabase
    .from('feedback_submission')
    .insert({
      project_id: projectId,
      slug: newSlug
    })
    .select('submission_uuid, slug')
    .single();

  if (insertError || !newSubmission) {
    console.error("Error creating new feedback submission:", insertError);
    return { error: 'Failed to create feedback link.' };
  }
  revalidatePath(`/projects/${projectId}`);
  return {
    uuid: newSubmission.submission_uuid,
    slug: newSubmission.slug
  };
}

/**
 * Deletes an entire project and all its related data (via cascading).
 */
export async function deleteProject(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be logged in to delete a project.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'Admin') {
    return { error: 'You do not have permission to delete this project.' };
  }

  const projectId = formData.get('projectId') as string;
  if (!projectId) return { error: 'Project ID is missing.' };

  const { error } = await supabase.from('projects').delete().eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    return { error: 'Database error: Could not delete the project.' };
  }

  revalidatePath('/');
  redirect('/');
}

/**
 * Toggles the project status between 'Active' and 'Done'.
 * Enforces rule: All videos must be 'Done' to mark project as 'Done'.
 */
export async function toggleProjectStatus(projectId: number, newStatus: 'Active' | 'Done'): Promise<FormState> {
  const supabase = await createClient();

  // Validate only valid statuses
  if (newStatus !== 'Active' && newStatus !== 'Done') {
    return { error: 'Invalid status.' };
  }

  // --- VALIDATION RULE: Prevent "Done" unless all videos approved ---
  if (newStatus === 'Done') {
    const { data: videos, error: videoError } = await supabase
      .from('videos')
      .select('status, title')
      .eq('project_id', projectId);

    if (videoError) {
      console.error('Error checking video status:', videoError);
      return { error: 'Database error checking videos.' };
    }

    if (!videos || videos.length === 0) {
      // Optional: Prevent Done if no videos? The user implies "all videos approved", 0 videos is technically all approved? 
      // Let's assume strict compliance: empty project shouldn't probably be "Done" in this context but let's allow it or warn.
      // For safety, let's allow 0 videos to be Done (maybe cancelled project), but if user wants content...
      // Let's stick to: "If there ARE videos, they must be Done".
    } else {
      const incompleteVideos = videos.filter(v => v.status !== 'Done');
      if (incompleteVideos.length > 0) {
        return {
          error: `Cannot mark as Done. ${incompleteVideos.length} video(s) are not approved yet (e.g. "${incompleteVideos[0].title}").`
        };
      }
    }
  }

  const { error } = await supabase
    .from('projects')
    .update({ status: newStatus })
    .eq('id', projectId);

  if (error) {
    console.error('Error updating project status:', error);
    return { error: 'Failed to update project status.' };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/');

  return { message: `Project marked as ${newStatus}!` };
}