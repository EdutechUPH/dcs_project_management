// src/app/admin/faculties/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server'; // Use the server helper
import { revalidatePath } from 'next/cache';

export async function addFaculty(formData: FormData) {
  const supabase = await createClient(); // Create the client instance
  const facultyName = formData.get('name') as string;
  if (!facultyName) return;
  await supabase.from('faculties').insert([{ name: facultyName }]);
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
  if (!facultyId || !facultyName) return;
  await supabase.from('faculties').update({ name: facultyName }).match({ id: facultyId });
  revalidatePath('/admin/faculties');
}