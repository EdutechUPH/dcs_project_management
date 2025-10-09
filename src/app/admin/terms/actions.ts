// src/app/admin/terms/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addTerm(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  if (!name) return;
  await supabase.from('terms').insert([{ name }]);
  revalidatePath('/admin/terms');
}

export async function deleteTerm(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  if (!id) return;
  await supabase.from('terms').delete().match({ id });
  revalidatePath('/admin/terms');
}

export async function updateTerm(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  if (!id || !name) return;
  await supabase.from('terms').update({ name }).match({ id });
  revalidatePath('/admin/terms');
}