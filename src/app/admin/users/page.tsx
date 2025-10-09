// src/app/admin/users/page.tsx
import { createClient } from '@/lib/supabase/server';
import UserList from './UserList';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { type Profile } from '@/lib/types';

export const revalidate = 0;

export default async function ManageUsersPage() {
  const supabase = await createClient();

  // 1. Fetch profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');

  // 2. Guard against missing environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase env vars for admin client');
    return <p>Error: Server is missing configuration.</p>;
  }

  // 3. Admin client to list all auth users
  const supabaseAdmin = createAdminClient(supabaseUrl, serviceKey);
  const { data: authUsersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

  // Handle errors
  const error = profilesError || usersError;
  if (error) {
    console.error("Error loading users:", error);
    return <p>Error loading users: { "message" in error ? error.message : "An unknown error occurred" }</p>
  }
  
  // 4. Combine the two lists, adding the email to each profile
  const usersById = new Map((authUsersData?.users ?? []).map((u) => [u.id, u]));
  const profilesWithEmail = (profiles as Profile[])?.map(profile => ({
    ...profile,
    email: usersById.get(profile.id)?.email,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage User Roles</h1>
      <UserList profiles={profilesWithEmail ?? []} />
    </div>
  );
}