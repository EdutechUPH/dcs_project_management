// src/app/admin/team_members/TeamMemberList.tsx
'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton';

type TeamMember = { id: number; name: string; role: 'Instructional Designer' | 'Digital Content Specialist' };
type TeamMemberListProps = {
  team_members: TeamMember[];
  deleteTeamMember: (formData: FormData) => Promise<void>;
  updateTeamMember: (formData: FormData) => Promise<void>;
};

export default function TeamMemberList({ team_members, deleteTeamMember, updateTeamMember }: TeamMemberListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <ul className="space-y-2 mt-2">
      {team_members.map((member) => (
        <li key={member.id} className="p-3 border rounded-md bg-white flex justify-between items-center">
          {editingId === member.id ? (
            <form action={updateTeamMember} onSubmit={() => setEditingId(null)} className="flex-grow flex items-center gap-2">
              <input type="hidden" name="id" value={member.id} />
              <input type="text" name="name" defaultValue={member.name} className="flex-grow border-gray-300 rounded-md shadow-sm p-2" required autoFocus />
              <select name="role" defaultValue={member.role} className="border-gray-300 rounded-md shadow-sm p-2">
                <option>Instructional Designer</option>
                <option>Digital Content Specialist</option>
              </select>
              <SubmitButton className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400">Save</SubmitButton>
              <button onClick={() => setEditingId(null)} type="button" className="text-sm">Cancel</button>
            </form>
          ) : (
            <>
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setEditingId(member.id)} className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">Edit</button>
                <form action={deleteTeamMember} onSubmit={(e) => { if (!confirm('Are you sure?')) e.preventDefault(); }}>
                  <input type="hidden" name="id" value={member.id} />
                  <SubmitButton className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:bg-gray-100" pendingText="Deleting...">Delete</SubmitButton>
                </form>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}