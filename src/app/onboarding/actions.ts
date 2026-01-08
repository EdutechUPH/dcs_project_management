// src/app/onboarding/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache'; // ✅ import this

// Define a type for the form state
type FormState = {
  message: string;
};

export async function completeProfile(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) {
    console.error('getUser error:', userErr);
  }
  if (!user) {
    return { message: 'User not found.' };
  }

  const fullName = (formData.get('full_name') as string | null) ?? '';

  if (!fullName) {
    return { message: 'Please fill out all fields.' };
  }

  // Update profile with name only. Role remains null (default) -> Pending Approval.
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      // role is explicitly NOT updated here, keeping it null
    })
    .eq('id', user.id);

  if (updateErr) {
    console.error('Error updating profile:', updateErr);
    return { message: 'Database error: Could not update profile.' };
  }

  // Revalidate the home layout/header, then redirect
  revalidatePath('/', 'layout');
  redirect('/');
}
