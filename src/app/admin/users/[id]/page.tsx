import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditUserForm } from './EditUserForm';

export default async function EditUserPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { id } = params;

    // Fetch the specific user profile
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !profile) {
        console.error("Error fetching user:", error);
        notFound();
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-6">
                <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    ← Back to Users
                </Link>
                <h1 className="text-3xl font-bold mt-2">Edit User</h1>
                <p className="text-gray-600">Update profile details for {profile.full_name}</p>
            </div>

            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <EditUserForm profile={profile} />
            </div>
        </div>
    );
}
