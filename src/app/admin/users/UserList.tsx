// src/app/admin/users/UserList.tsx
'use client';

import { updateUserRole } from './actions';
import SubmitButton from '@/components/SubmitButton';
import { type Profile } from '@/lib/types';

const userRoles = ['Admin', 'Instructional Designer', 'Digital Content Specialist'];

export default function UserList({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="mt-4 border rounded-lg bg-white">
      {/* Header Row */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
        <div className="col-span-1">Name</div>
        <div className="col-span-1">Email</div>
        <div className="col-span-1">Role</div>
        <div className="col-span-1 text-right">Action</div>
      </div>
      {/* Data Rows */}
      <div className="divide-y divide-gray-200">
        {profiles.map(profile => (
          <form action={updateUserRole} key={profile.id} className="grid grid-cols-4 gap-4 p-4 items-center">
            <input type="hidden" name="profileId" value={profile.id} />
            <div className="col-span-1 text-sm font-medium text-gray-900">{profile.full_name}</div>
            <div className="col-span-1 text-sm text-gray-500 truncate">{profile.email}</div>
            <div className="col-span-1 text-sm text-gray-500">
              <select
                name="role"
                defaultValue={profile.role}
                className="rounded-md border-gray-300 shadow-sm p-2"
              >
                {userRoles.map(role => <option key={role}>{role}</option>)}
              </select>
            </div>
            <div className="col-span-1 text-right">
              <SubmitButton 
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                pendingText="Saving..."
              >
                Save
              </SubmitButton>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}