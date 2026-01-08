import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { UserRow } from './UserRow';
import { PendingUserRow } from './PendingUserRow';
import { AlertCircle } from 'lucide-react';

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

  const pendingUsers = profiles?.filter(p => !p.role) || [];
  const activeUsers = profiles?.filter(p => !!p.role) || [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/admin" className="text-sm text-gray-600 hover:underline">← Back to Admin Dashboard</Link>
          <h1 className="text-3xl font-bold mt-2">Manage Users</h1>
          <p className="text-gray-500">View and manage user roles and access permissions.</p>
        </div>
      </div>

      {/* Pending Requests Section */}
      {pendingUsers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-yellow-200 bg-yellow-100/50 flex items-center gap-2">
            <AlertCircle className="text-yellow-700 w-5 h-5" />
            <h2 className="font-semibold text-yellow-800">Pending Requests ({pendingUsers.length})</h2>
          </div>
          <table className="min-w-full divide-y divide-yellow-200/50">
            <thead className="bg-yellow-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Name / Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-yellow-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-200/50">
              {pendingUsers.map((profile) => (
                <PendingUserRow key={profile.id} profile={profile} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Active Users Section */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-700">Active Staff</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeUsers.map((profile) => (
              <UserRow key={profile.id} profile={profile} />
            ))}
            {activeUsers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No active users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}