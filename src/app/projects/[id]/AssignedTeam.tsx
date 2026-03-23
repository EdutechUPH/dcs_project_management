// src/app/projects/[id]/AssignedTeam.tsx
'use client';

import { assignTeamMember, removeTeamMemberAssignment } from './actions';
import SubmitButton from '@/components/SubmitButton';
import { useActionState } from 'react';
import { useMemo } from 'react';
import { PROJECT_ROLES } from '@/lib/constants';
import { type Assignment, type Profile } from '@/lib/types';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

type Workload = {
  member_name: string;
  active_videos: number;
};

type AssignedTeamProps = {
  projectId: number;
  assignments: Assignment[];
  profiles: Profile[];
  workloadData: Workload[];
};

const initialState = { message: '' };

export default function AssignedTeam({ projectId, assignments, profiles, workloadData }: AssignedTeamProps) {
  const assignMemberWithId = assignTeamMember.bind(null, projectId);
  const [state, formAction] = useActionState(assignMemberWithId, initialState);
  
  // A separate state is needed for the remove action since each button is in its own form
  const [removeState, removeFormAction] = useActionState(removeTeamMemberAssignment, initialState);

  const profilesByRole = useMemo(() => {
    const workloadMap = new Map((workloadData || []).map(item => [item.member_name, item.active_videos]));
    const enriched = profiles.map(profile => ({
      ...profile,
      workload: workloadMap.get(profile.full_name) || 0,
    }));

    enriched.sort((a, b) => a.full_name.localeCompare(b.full_name));

    return {
      dcs: enriched.filter(p => p.role === 'Digital Content Specialist'),
      id: enriched.filter(p => p.role === 'Instructional Designer'),
      admin: enriched.filter(p => p.role === 'Admin'),
      others: enriched.filter(p => !['Digital Content Specialist', 'Instructional Designer', 'Admin'].includes(p.role))
    };
  }, [profiles, workloadData]);

  const validAssignments = assignments.filter(a => a.profiles);

  return (
    <div className="mt-8 lg:mt-0">
      <h2 className="text-xl font-semibold mb-4">Assigned Team</h2>
      <div className="p-6 border rounded-lg bg-white">
        <form action={formAction} className="grid grid-cols-1 gap-4 items-end mb-6 pb-6 border-b">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
            <Select name="profile_id" required>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select a member..." />
              </SelectTrigger>
              <SelectContent>
                {profilesByRole.dcs.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="bg-blue-50/50 text-blue-800 font-bold border-b border-blue-100">Digital Content Specialists</SelectLabel>
                    {profilesByRole.dcs.map(p => (
                      <SelectItem key={p.id} value={p.id} className="data-[highlighted]:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors cursor-pointer pl-6 py-2">
                        {p.full_name} <span className="text-muted-foreground ml-1">({p.workload} active videos)</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {profilesByRole.id.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="bg-purple-50/50 text-purple-800 font-bold border-b border-purple-100 mt-2">Instructional Designers</SelectLabel>
                    {profilesByRole.id.map(p => (
                      <SelectItem key={p.id} value={p.id} className="data-[highlighted]:bg-purple-50 focus:bg-purple-50 focus:text-purple-900 transition-colors cursor-pointer pl-6 py-2">
                        {p.full_name} <span className="text-muted-foreground ml-1">({p.workload} active videos)</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {profilesByRole.admin.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="bg-yellow-50/50 text-yellow-800 font-bold border-b border-yellow-100 mt-2">Admins</SelectLabel>
                    {profilesByRole.admin.map(p => (
                      <SelectItem key={p.id} value={p.id} className="data-[highlighted]:bg-yellow-50 focus:bg-yellow-50 focus:text-yellow-900 transition-colors cursor-pointer pl-6 py-2">
                        {p.full_name} <span className="text-muted-foreground ml-1">({p.workload} active videos)</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
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