// src/app/admin/lecturers/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { type LecturerOption } from '@/lib/types';

// Define a state type for this action's return value
type ActionState = {
  error?: string | null;
  data?: LecturerOption | null;
}

// THE FIX: Add 'prevState' as the first argument
export async function addLecturer(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const prodiIds = formData.getAll('prodi_ids') as string[];
  
  if (!name) return { error: 'Lecturer name is required.' };

  const { data: newLecturer, error: lecturerError } = await supabase
    .from('lecturers')
    .insert([{ name, email }])
    .select('id, name, email') // Select the full object
    .single();

  if (lecturerError) {
    console.error('Error adding lecturer:', lecturerError);
    return { error: 'Database error: Could not add lecturer.' };
  }

  if (prodiIds && prodiIds.length > 0) {
    const assignments = prodiIds.map(prodiId => ({
      lecturer_id: newLecturer.id,
      prodi_id: parseInt(prodiId),
    }));
    
    const { error: joinError } = await supabase
      .from('lecturer_prodi_join')
      .insert(assignments);

    if (joinError) {
      console.error('Error linking lecturer to programs:', joinError);
      return { error: 'Database error: Could not link programs.' };
    }
  }
  
  revalidatePath('/projects/new');
  revalidatePath('/admin/lecturers');
  return { data: newLecturer };
}

export async function deleteLecturer(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  if (!id) return;
  await supabase.from('lecturers').delete().match({ id });
  revalidatePath('/admin/lecturers');
}

export async function updateLecturer(formData: FormData) {
  const supabase = createClient();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  if (!id || !name) return;
  await supabase.from('lecturers').update({ name, email }).match({ id });
  revalidatePath('/admin/lecturers');
}