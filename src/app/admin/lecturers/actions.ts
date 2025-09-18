// src/app/admin/lecturers/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addLecturer(formData: FormData) {
  const supabase = createClient();
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  if (!name) return;
  await supabase.from('lecturers').insert([{ name, email }]);
  revalidatePath('/admin/lecturers');
}

export async function deleteLecturer(formData: FormData) {
  const supabase = createClient();
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