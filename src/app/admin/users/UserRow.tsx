// src/app/admin/users/UserRow.tsx
'use client';

import { useActionState } from 'react';
import { updateUserRole } from './actions';
import SubmitButton from '@/components/SubmitButton';
import { type Profile } from '@/lib/types';

const userRoles = ['Admin', 'Instructional Designer', 'Digital Content Specialist'];

export default function UserRow({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(updateUserRole, { error: null });

  return (
    <tr className="group">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{profile.full_name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate">{profile.email}</td>
      {/* The form now lives entirely inside the last table cell */}
      <td className="px-6 py-4 whitespace-nowrap text-sm" colSpan={2}>
        <form action={formAction} className="flex items-center justify-between gap-4">
          <input type="hidden" name="profileId" value={profile.id} />
          <select
            name="role"
            defaultValue={profile.role}
            className="w-full rounded-md border-gray-300 shadow-sm p-2 group-hover:bg-gray-50"
          >
            {userRoles.map(role => <option key={role}>{role}</option>)}
          </select>
          <SubmitButton 
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            pendingText="Saving..."
          >
            Save
          </SubmitButton>
          {state?.error && <p className="text-xs text-red-600 mt-1">{state.error}</p>}
        </form>
      </td>
    </tr>
  );
}