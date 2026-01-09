// src/app/admin/lecturers/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { type LecturerOption } from '@/lib/types';

export type State = {
  error: string | null;
  data: { id: number; name: string } | null;
} | null;

export async function addLecturer(prevState: State | any, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const facultyIds = formData.getAll('faculty_ids') as string[]; // Changed from prodi_ids

  if (!name) {
    return { error: 'Name is required', data: null };
  }

  // 1. Create Lecturer
  const { data: lecturer, error: createError } = await supabase
    .from('lecturers')
    .insert({ name, email })
    .select()
    .single();

  if (createError) {
    console.error('Error creating lecturer:', createError);
    return { error: createError.message, data: null };
  }

  // 2. Assign Faculties (if any)
  if (facultyIds.length > 0) {
    const assignments = facultyIds.map(fId => ({
      lecturer_id: lecturer.id,
      faculty_id: parseInt(fId),
    }));

    const { error: assignError } = await supabase
      .from('lecturer_faculty_join')
      .insert(assignments);

    if (assignError) {
      console.error('Error assigning faculties:', assignError);
      // We don't rollback the lecturer creation (simplified), but return error
      return { error: 'Lecturer created but failed to assign faculties', data: lecturer };
    }
  }

  revalidatePath('/admin/lecturers');
  return { error: null, data: lecturer };
}

export async function deleteLecturer(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id');

  const { error } = await supabase.from('lecturers').delete().eq('id', id);

  if (error) {
    console.error('Error deleting lecturer:', error);
    return;
  }

  revalidatePath('/admin/lecturers');
}

export async function updateLecturer(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  if (!id || !name) return;
  await supabase.from('lecturers').update({ name, email }).match({ id });
  revalidatePath('/admin/lecturers');
}