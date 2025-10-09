// src/app/admin/prodi/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addProdi(formData: FormData) {
  const supabase = createClient();
  const name = formData.get('name') as string;
  const faculty_id = formData.get('faculty_id') as string;
  if (!name || !faculty_id) return;

  await supabase.from('prodi').insert([{ name, faculty_id: parseInt(faculty_id) }]);
  revalidatePath('/admin/prodi');
}

export async function deleteProdi(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  if (!id) return;
  await supabase.from('prodi').delete().match({ id });
  revalidatePath('/admin/prodi');
}

export async function updateProdi(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const faculty_id = formData.get('faculty_id') as string;
  if (!id || !name || !faculty_id) return;

  await supabase.from('prodi').update({ name, faculty_id: parseInt(faculty_id) }).match({ id });
  revalidatePath('/admin/prodi');
}