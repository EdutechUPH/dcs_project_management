// src/app/onboarding/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function completeProfile(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'User not found.' };
  }

  const fullName = formData.get('full_name') as string;
  const role = formData.get('role') as string;

  if (!fullName || !role) {
    return { message: 'Please fill out all fields.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      full_name: fullName,
      role: role
    })
    .eq('id', user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { message: 'Database error: Could not update profile.' };
  }

  redirect('/');
}