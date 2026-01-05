import { createClient } from '@/lib/supabase/server';
import { updateUserRole, deleteUser } from '../actions';
import Link from 'next/link';

// Simple Client Component for the Row Actions to avoid complex table setup for now
import { UserRow } from './UserRow';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Fetch all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');

  if (error) {
    return <div className="p-8">Error loading users: {error.message}</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin" className="text-sm text-gray-600 hover:underline">← Back to Admin Dashboard</Link>
          <h1 className="text-3xl font-bold mt-2">Manage Users</h1>
          <p className="text-gray-500">View and manage user roles and access permissions.</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profiles?.map((profile) => (
              <UserRow key={profile.id} profile={profile} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}