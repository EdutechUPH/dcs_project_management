// src/app/admin/lecturers/[id]/assign/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateLecturerAssignments(lecturerId: number, formData: FormData) {
  const supabase = await createClient();
  const facultyIds = formData.getAll('faculty_id') as string[];

  // 1. Delete all existing faculty assignments for this lecturer
  const { error: deleteError } = await supabase
    .from('lecturer_faculty_join')
    .delete()
    .eq('lecturer_id', lecturerId);

  if (deleteError) {
    console.error('Error deleting assignments:', deleteError);
    return; // Or return an error state
  }

  // 2. Insert the new assignments if any are selected
  if (facultyIds.length > 0) {
    const newAssignments = facultyIds.map(facultyId => ({
      lecturer_id: lecturerId,
      faculty_id: parseInt(facultyId),
    }));

    const { error: insertError } = await supabase
      .from('lecturer_faculty_join')
      .insert(newAssignments);

    if (insertError) {
      console.error('Error inserting new assignments:', insertError);
      return; // Or return an error state
    }
  }

  // 3. Revalidate and redirect back to the main lecturers page
  revalidatePath('/admin/lecturers');
  redirect('/admin/lecturers');
}