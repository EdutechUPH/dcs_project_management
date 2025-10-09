// src/app/projects/new/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { type LecturerOption } from '@/lib/types';

// Define a specific type for our form state
type FormState = {
  message: string;
};

export async function createProject(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  
  const course_name = formData.get('course_name') as string;
  const term_id = Number(formData.get('term_id'));
  const faculty_id = Number(formData.get('faculty_id'));
  const prodi_id = Number(formData.get('prodi_id'));
  const lecturer_id = Number(formData.get('lecturer_id'));

  if (!course_name || !term_id || !faculty_id || !prodi_id || !lecturer_id) {
    return { message: 'Please ensure all required fields are filled out.' };
  }

  const projectData = {
    course_name,
    term_id,
    faculty_id,
    prodi_id,
    lecturer_id,
    notes: formData.get('notes') as string,
    due_date: formData.get('due_date') as string,
  };
  
  const { data: newProject, error: projectError } = await supabase
    .from('projects')
    .insert(projectData)
    .select('id')
    .single();

  if (projectError || !newProject) {
    console.error('Error creating project:', projectError);
    return { message: `Database Error: Failed to create project. Check terminal for details.` };
  }

  const videoCount = Number(formData.get('video_count'));
  const videosToInsert = [];
  for (let i = 0; i < videoCount; i++) {
    const title = formData.get(`video_title_${i}`) as string;
    if (title) {
      videosToInsert.push({ project_id: newProject.id, title: title, status: 'Requested' });
    }
  }

  if (videosToInsert.length > 0) {
    const { error: videoError } = await supabase.from('videos').insert(videosToInsert);
    if (videoError) {
      console.error('Error creating videos:', videoError);
      return { message: `Database Error: Failed to create videos. Check terminal for details.` };
    }
  }
  
  revalidatePath('/');
  revalidatePath(`/projects/${newProject.id}`);
  redirect('/');
}

export async function getLecturersByProdi(prodiId: number): Promise<LecturerOption[]> {
  const supabase = createClient();
  if (!prodiId) return [];

  // Explicitly tell Supabase what shape to expect
  const { data, error } = await supabase
    .from('lecturer_prodi_join')
    .select('lecturers(id, name, email)')
    .eq('prodi_id', prodiId);

  if (error) {
    console.error('Error fetching lecturers:', error);
    return [];
  }

  // Explicitly cast each lecturer correctly
  const lecturers =
    data?.map((item: { lecturers: LecturerOption | null }) => item.lecturers)
      .filter((lecturer): lecturer is LecturerOption => Boolean(lecturer)) ?? [];

  return lecturers;
}
