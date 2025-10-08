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
    <form action={formAction} className="contents">
      <tr className="group">
        <input type="hidden" name="profileId" value={profile.id} />
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{profile.full_name}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate">{profile.email}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <select
            name="role"
            defaultValue={profile.role}
            className="rounded-md border-gray-300 shadow-sm p-2 group-hover:bg-gray-50"
          >
            {userRoles.map(role => <option key={role}>{role}</option>)}
          </select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <SubmitButton 
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            pendingText="Saving..."
          >
            Save
          </SubmitButton>
          {state?.error && <p className="text-xs text-red-600 mt-1">{state.error}</p>}
        </td>
      </tr>
    </form>
  );
}