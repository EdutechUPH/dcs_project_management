// src/app/admin/team_members/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addTeamMember(formData: FormData) {
  const supabase = createClient();
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  if (!name || !role) return;
  await supabase.from('team_members').insert([{ name, role }]);
  revalidatePath('/admin/team_members');
}

export async function deleteTeamMember(formData: FormData) {
  const supabase = createClient();
  const id = formData.get('id') as string;
  if (!id) return;
  await supabase.from('team_members').delete().match({ id });
  revalidatePath('/admin/team_members');
}

export async function updateTeamMember(formData: FormData) {
  const supabase = createClient();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  if (!id || !name || !role) return;
  await supabase.from('team_members').update({ name, role }).match({ id });
  revalidatePath('/admin/team_members');
}