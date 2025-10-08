// src/app/admin/users/actions.ts
&#39;use server&#39;;

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ActionState = {
error?: string | null;
};

// THE FIX: Add 'prevState' as the first argument
export async function updateUserRole(prevState: ActionState, formData: FormData): Promise&lt;ActionState&gt; {
const supabase = createClient();

// First, check if the person making the request is an Admin
const { data: { user } } = await supabase.auth.getUser();
if (\!user) return { error: 'You must be logged in.' };

const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
if (profile?.role \!== 'Admin') {
return { error: 'You do not have permission to change user roles.' };
}

// If they are an admin, proceed with the update
const profileId = formData.get('profileId') as string;
const newRole = formData.get('role') as string;

if (\!profileId || \!newRole) {
return { error: 'Missing profile ID or role.' };
}

const { error } = await supabase
.from('profiles')
.update({ role: newRole })
.eq('id', profileId);

if (error) {
console.error("Error updating role:", error);
return { error: 'Database error: Could not update role.' };
}

revalidatePath('/admin/users');
return { error: null }; // Return success state
}