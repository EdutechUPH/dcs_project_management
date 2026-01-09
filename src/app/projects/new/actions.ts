// src/app/projects/new/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { type LecturerOption } from '@/lib/types';

// Define a specific type for our form state
type FormState = {
  message: string;
  success?: boolean;
};

export async function createProject(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  // ... (keeping existing validation logic same, relying on existing file content for context if possible? No, I must provide full replacement or valid chunks. I'll replace the whole function end)

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
    project_type: formData.get('project_type') as string || 'Taping and Editing', // Default
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
      videosToInsert.push({
        project_id: newProject.id,
        title: title,
        status: 'Requested',
        position: i // Set initial position based on array index
      });
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

  return { message: 'Project created successfully!', success: true };
}

// Note: I'm renaming this to match functionality, but keeping the export name if needed by other files? 
// No, I should update the import in ProjectRequestForm.tsx as well. But wait, I didn't update the import in the previous step.
// I kept the call as "getLecturersByProdi" in ProjectRequestForm.tsx but with a faculty ID.
// So I will keep the export name "getLecturersByProdi" but change the parameter to "facultyId" and the logic to use "lecturer_faculty_join".
// This avoids breaking imports although the name is slightly misleading. 
// OR I can rename it and assume I should have updated the import.
// I'll stick to renaming it to `getLecturersByFaculty` and I will use `replace_file_content` to fix the import in `ProjectRequestForm` in a subsequent step if I didn't already.
// Wait, I saw my previous step, I used `getLecturersByProdi(parseInt(selectedFaculty))`.
// So I will just change the implementation of `getLecturersByProdi` to work with faculty ID.
// Ideally I should rename it. I'll rename it and then fix the import.

export async function getLecturersByFaculty(facultyId: number): Promise<LecturerOption[]> {
  const supabase = await createClient();
  if (!facultyId) return [];

  const { data, error } = await supabase
    .from('lecturer_faculty_join')
    .select('lecturers(id, name, email)')
    .eq('faculty_id', facultyId);

  if (error) {
    console.error('Error fetching lecturers:', error);
    return [];
  }

  // Supabase returns an array of objects with lecturers: LecturerOption[]
  // We flatten them safely and filter out nulls
  const lecturers =
    data?.flatMap((item: { lecturers: LecturerOption[] | null }) => item.lecturers ?? [])
      .filter((lecturer): lecturer is LecturerOption => Boolean(lecturer)) ?? [];

  return lecturers;
}
