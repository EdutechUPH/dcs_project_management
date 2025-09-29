// src/app/admin/users/page.tsx
import { createClient } from '@/lib/supabase/server';
import UserList from './UserList';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const revalidate = 0;

export default async function ManageUsersPage() {
  const supabase = createClient();

  // 1. Fetch all profiles from our public table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');

  // 2. Create a special admin client to fetch all auth users
  // This uses the Service Role Key and should ONLY be used on the server.
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

  const error = profilesError || usersError;
  if (error) {
    console.error("Error loading users:", error);
    return <p>Error loading users: {error.message}</p>
  }
  
  // 3. Combine the two lists, adding the email to each profile
  const usersById = new Map(authUsers?.users.map(user => [user.id, user]));
  const profilesWithEmail = profiles?.map(profile => ({
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