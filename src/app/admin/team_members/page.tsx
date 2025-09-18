// src/app/admin/team_members/page.tsx
import { createClient } from '@/lib/supabase/server';
import TeamMemberList from './TeamMemberList';
import { addTeamMember, deleteTeamMember, updateTeamMember } from './actions';
import SubmitButton from '@/components/SubmitButton';

export const revalidate = 0;

export default async function TeamMembersPage() {
  const supabase = createClient();
  const { data: team_members, error } = await supabase.from('team_members').select('*').order('name', { ascending: true });
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Team Members</h1>
      <form action={addTeamMember} className="mb-6 p-4 border rounded-md bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Member Name</label>
          <input type="text" name="name" id="name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" required />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
          <select name="role" id="role" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" required>
            <option>Instructional Designer</option>
            <option>Digital Content Specialist</option>
          </select>
        </div>
        <SubmitButton className="bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700 disabled:bg-gray-400" pendingText="Saving...">Save Member</SubmitButton>
      </form>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Existing Members</h2>
        <TeamMemberList team_members={team_members ?? []} deleteTeamMember={deleteTeamMember} updateTeamMember={updateTeamMember} />
      </div>
    </div>
  );
}