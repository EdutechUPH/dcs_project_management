// src/app/admin/users/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// --- Direct Actions for Client Components (Dropdowns/Buttons) ---

export async function updateUserRole(profileId: string, newRole: string) {
  const supabase = await createClient();

  // Admin Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not logged in' };

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (adminProfile?.role !== 'Admin') return { error: 'Unauthorized' };

  if (profileId === user.id && newRole !== 'Admin') {
    return { error: "Cannot remove your own Admin status." };
  }

  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);

  if (error) return { error: error.message };
  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(profileId: string) {
  const supabase = await createClient();
  // Admin Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not logged in' };

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (adminProfile?.role !== 'Admin') return { error: 'Unauthorized' };

  if (profileId === user.id) return { error: "Cannot delete yourself." };

  const { error } = await supabase.from('profiles').delete().eq('id', profileId);

  if (error) return { error: error.message };
  revalidatePath('/admin/users');
  return { success: true };
}

export async function approveUser(profileId: string, role: string) {
  return updateUserRole(profileId, role);
}

export async function rejectUser(profileId: string) {
  return deleteUser(profileId);
}