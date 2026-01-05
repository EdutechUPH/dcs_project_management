// src/app/admin/faculties/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server'; // Use the server helper
import { revalidatePath } from 'next/cache';

export async function addFaculty(formData: FormData) {
  const supabase = await createClient();
  const facultyName = formData.get('name') as string;
  const shortName = formData.get('short_name') as string;

  console.log('[KB-DEBUG] addFaculty');
  console.log(' - Faculty Name:', facultyName);
  console.log(' - Short Name Raw:', shortName);

  if (!facultyName) return;

  const payload = {
    name: facultyName,
    short_name: shortName?.trim() || null
  };

  console.log(' - Inserting Payload:', payload);

  const { error } = await supabase.from('faculties').insert([payload]);

  if (error) {
    console.error('[KB-DEBUG] Insert Error:', error);
  }

  revalidatePath('/admin/faculties');
}

export async function deleteFaculty(formData: FormData) {
  const supabase = await createClient(); // Create the client instance
  const facultyId = formData.get('id') as string;
  if (!facultyId) return;
  await supabase.from('faculties').delete().match({ id: facultyId });
  revalidatePath('/admin/faculties');
}

export async function updateFaculty(formData: FormData) {
  const supabase = await createClient(); // Create the client instance
  const facultyId = formData.get('id') as string;
  const facultyName = formData.get('name') as string;
  const shortName = formData.get('short_name') as string;

  if (!facultyId || !facultyName) return;

  await supabase
    .from('faculties')
    .update({ name: facultyName, short_name: shortName || null })
    .match({ id: facultyId });

  revalidatePath('/admin/faculties');
}