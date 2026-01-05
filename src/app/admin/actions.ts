'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { type Profile } from '@/lib/types';
import { redirect } from 'next/navigation';

// ... (existing functions: createUser can stay or be removed if unused)

export async function updateUserRole(userId: string, newRole: 'Admin' | 'Instructional Designer' | 'Digital Content Specialist') {
    // ... (keep existing implementation)
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) { console.error(error); return { success: false, message: error.message }; }
    revalidatePath('/admin/users');
    return { success: true, message: 'Role updated.' };
}

export async function deleteUser(userId: string) {
    // ... (keep existing implementation)
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) { return { success: false, message: error.message }; }
    revalidatePath('/admin/users');
    return { success: true, message: 'User removed.' };
}

// NEW: Full Profile Update
export async function updateProfile(userId: string, formData: FormData) {
    const supabase = await createClient();

    const full_name = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;

    if (!full_name || !role) {
        return { success: false, message: "Name and Role are required." };
    }

    // Note: Updating 'email' in 'profiles' is simple, but it DOES NOT automatically update Supabase Auth email.
    // Changing Auth email requires 'supabase.auth.admin.updateUserById' which needs Service Role key.
    // For now, we will just update the 'contact email' in the profile table.

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name,
            email, // We update the profile's record of the email
            role
        })
        .eq('id', userId);

    if (error) {
        console.error("Error updating profile:", error);
        return { success: false, message: "Failed to update profile: " + error.message };
    }

    revalidatePath('/admin/users');
    redirect('/admin/users');
}

// --- METADATA ACTIONS ---

// Faculties
export async function addFaculty(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;

    if (!name) return { success: false, message: "Name required" };

    const { error } = await supabase.from('faculties').insert({ name });

    if (error) return { success: false, message: error.message };

    revalidatePath('/admin/faculties');
    return { success: true, message: "Faculty added." };
}

export async function deleteFaculty(id: number) {
    const supabase = await createClient();
    const { error } = await supabase.from('faculties').delete().eq('id', id);
    if (error) return { success: false, message: error.message };

    revalidatePath('/admin/faculties');
    return { success: true, message: "Faculty deleted." };
}

// Terms
export async function addTerm(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;

    if (!name) return { success: false, message: "Name required" };

    const { error } = await supabase.from('terms').insert({ name });

    if (error) return { success: false, message: error.message };

    revalidatePath('/admin/terms');
    return { success: true, message: "Term added." };
}

export async function deleteTerm(id: number) {
    const supabase = await createClient();
    const { error } = await supabase.from('terms').delete().eq('id', id);
    if (error) return { success: false, message: error.message };

    revalidatePath('/admin/terms');
    return { success: true, message: "Term deleted." };
}
