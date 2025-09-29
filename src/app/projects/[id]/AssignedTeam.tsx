// src/app/projects/[id]/AssignedTeam.tsx
'use client';

import { assignTeamMember, removeTeamMemberAssignment } from './actions';
import SubmitButton from '@/components/SubmitButton';
import { useActionState } from 'react';
import { useMemo } from 'react';
import { PROJECT_ROLES } from '@/lib/constants';

type Workload = {
  member_name: string;
  active_videos: number;
};

type AssignedTeamProps = {
  projectId: number;
  assignments: any[];
  profiles: any[];
  workloadData: Workload[];
};

const initialState = { message: '' };

export default function AssignedTeam({ projectId, assignments, profiles, workloadData }: AssignedTeamProps) {
  const assignMemberWithId = assignTeamMember.bind(null, projectId);
  const [state, formAction] = useActionState(assignMemberWithId, initialState);
  
  // A separate state is needed for the remove action since it's a different form
  const [removeState, removeFormAction] = useActionState(removeTeamMemberAssignment, initialState);

  const sortedProfiles = useMemo(() => {
    const workloadMap = new Map(workloadData.map(item => [item.member_name, item.active_videos]));
    return profiles
      .map(profile => ({
        ...profile,
        workload: workloadMap.get(profile.full_name) || 0,
      }))
      .sort((a, b) => a.workload - b.workload);
  }, [profiles, workloadData]);

  const validAssignments = assignments.filter(a => a.profiles);

  return (
    <div className="mt-8 lg:mt-0">
      <h2 className="text-xl font-semibold mb-4">Assigned Team</h2>
      <div className="p-6 border rounded-lg bg-white">
        <form action={formAction} className="grid grid-cols-1 gap-4 items-end mb-6 pb-6 border-b">
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Member</label>
            <select name="profile_id" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
              <option value="">Select a member...</option>
              {sortedProfiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name} ({profile.workload} active videos)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Role</label>
            <select name="role" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
              <option value="">Select a role</option>
              {PROJECT_ROLES.map(role => <option key={role}>{role}</option>)}
            </select>
          </div>
          <SubmitButton className="bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700 disabled:bg-gray-400" pendingText="Assigning...">
            Assign Member
          </SubmitButton>
          {state?.message && <p className="text-sm text-red-500 mt-2">{state.message}</p>}
        </form>

        <div className="space-y-3">
          {validAssignments.length > 0 ? (
            validAssignments.map(assignment => (
              <div key={assignment.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{assignment.profiles.full_name}</p>
                  <p className="text-sm text-gray-500">{assignment.role}</p>
                </div>
                <form action={removeFormAction}>
                  <input type="hidden" name="assignmentId" value={assignment.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">Remove</button>
                </form>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No team members assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}