// src/app/admin/users/UserList.tsx
'use client';

import { type Profile } from '@/lib/types';
import { UserRow } from './UserRow';

export default function UserList({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="mt-4 border rounded-lg bg-white overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            {/* Combined Role and Action into one header */}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" colSpan={2}>Role</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {profiles.map(profile => (
            <UserRow key={profile.id} profile={profile} />
          ))}
        </tbody>
      </table>
    </div>
  );
}