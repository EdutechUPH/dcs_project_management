// src/app/admin/lecturers/[id]/assign/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateLecturerAssignments(lecturerId: number, formData: FormData) {
  const supabase = createClient();
  const prodiIds = formData.getAll('prodi_id') as string[];

  // 1. Delete all existing assignments for this lecturer
  const { error: deleteError } = await supabase
    .from('lecturer_prodi_join')
    .delete()
    .eq('lecturer_id', lecturerId);

  if (deleteError) {
    console.error('Error deleting assignments:', deleteError);
    return;
  }

  // 2. Insert the new assignments if any are selected
  if (prodiIds.length > 0) {
    const newAssignments = prodiIds.map(prodiId => ({
      lecturer_id: lecturerId,
      prodi_id: parseInt(prodiId),
    }));

    const { error: insertError } = await supabase
      .from('lecturer_prodi_join')
      .insert(newAssignments);

    if (insertError) {
      console.error('Error inserting new assignments:', insertError);
      return;
    }
  }

  // 3. Revalidate and redirect back to the main lecturers page
  revalidatePath('/admin/lecturers');
  redirect('/admin/lecturers');
}