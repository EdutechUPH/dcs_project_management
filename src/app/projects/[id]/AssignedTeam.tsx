// src/app/projects/[id]/AssignedTeam.tsx
'use client';

import { assignTeamMember, removeTeamMemberAssignment } from './actions';
import SubmitButton from '@/components/SubmitButton';
import { useActionState, useRef, useState } from 'react';
import { useMemo } from 'react';
import { type Assignment, type Profile, type Video } from '@/lib/types';
import { MAIN_EDITOR_ROLE } from '@/lib/constants';
import ConfirmationModal from '@/components/ConfirmationModal';
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
  /** Needed to tell the user exactly which videos an assignment will and will not touch. */
  videos: Video[];
};

const initialState = { message: '' };

export default function AssignedTeam({ projectId, assignments, profiles, workloadData, videos }: AssignedTeamProps) {
  const assignMemberWithId = assignTeamMember.bind(null, projectId);
  const [state, formAction] = useActionState(assignMemberWithId, initialState);

  // A separate state is needed for the remove action since each button is in its own form
  const [removeState, removeFormAction] = useActionState(removeTeamMemberAssignment, initialState);

  // ---------------------------------------------------------------------
  // Assigning a main editor rewrites who gets credited for finished work, so it is never
  // submitted straight from the form — the dialog states the exact counts first.
  // ---------------------------------------------------------------------
  const assignFormRef = useRef<HTMLFormElement>(null);
  const [pendingAssign, setPendingAssign] = useState<{ profileId: string; role: string } | null>(null);
  const [reassignAll, setReassignAll] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Assignment | null>(null);

  const nameOf = (profileId: string | null | undefined) =>
    profiles.find(p => p.id === profileId)?.full_name ?? 'Unassigned';

  /** How the project's videos are credited right now. */
  const creditBreakdown = useMemo(() => {
    const noEditor = videos.filter(v => !v.main_editor_id);
    const byEditor = new Map<string, number>();
    videos.forEach(v => {
      if (!v.main_editor_id) return;
      byEditor.set(v.main_editor_id, (byEditor.get(v.main_editor_id) ?? 0) + 1);
    });
    return { noEditor: noEditor.length, byEditor, total: videos.length };
  }, [videos]);

  const handleAssignSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // Already confirmed: confirmAssign re-submits this same form, and without this the guard
    // below would cancel it and reopen the dialog forever.
    if (pendingAssign) return;

    const data = new FormData(event.currentTarget);
    const role = data.get('role') as string;
    const profileId = data.get('profile_id') as string;

    // Only the main-editor role touches video credit; every other role is a plain insert.
    if (role !== MAIN_EDITOR_ROLE || !profileId) return;

    event.preventDefault();
    setReassignAll(false);
    setPendingAssign({ profileId, role });
  };

  const confirmAssign = () => {
    // requestSubmit rather than submit(): it runs the React action, and by now the hidden
    // reassign_all input reflects the choice made in the dialog.
    assignFormRef.current?.requestSubmit();
    setPendingAssign(null);
  };

  const removeFormRef = useRef<HTMLFormElement>(null);
  const confirmRemove = () => {
    removeFormRef.current?.requestSubmit();
    setRemoveTarget(null);
  };

  const pendingName = pendingAssign ? nameOf(pendingAssign.profileId) : '';
  const othersCredited = pendingAssign
    ? Array.from(creditBreakdown.byEditor.entries()).filter(([id]) => id !== pendingAssign.profileId)
    : [];
  const alreadyTheirs = pendingAssign ? creditBreakdown.byEditor.get(pendingAssign.profileId) ?? 0 : 0;
  const othersTotal = othersCredited.reduce((sum, [, count]) => sum + count, 0);

  const removeVideoCount = removeTarget
    ? creditBreakdown.byEditor.get(removeTarget.profiles?.id ?? '') ?? 0
    : 0;

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
      <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-md">
        <form
          ref={assignFormRef}
          action={formAction}
          onSubmit={handleAssignSubmit}
          className="grid grid-cols-1 gap-4 items-end mb-6 pb-6 border-b"
        >
          {/* Read by assignTeamMember; only ever 'on' when ticked in the dialog. */}
          <input type="hidden" name="reassign_all" value={reassignAll ? 'on' : 'off'} />
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
            <Select name="role" required>
              <SelectTrigger className="mt-1 w-full bg-white">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="bg-purple-50/50 text-purple-800 font-bold border-b border-purple-100">Instructional Designer</SelectLabel>
                  <SelectItem value="Instructional Designer" className="data-[highlighted]:bg-purple-50 focus:bg-purple-50 focus:text-purple-900 transition-colors cursor-pointer pl-6 py-2">
                    Instructional Designer
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="bg-blue-50/50 text-blue-800 font-bold border-b border-blue-100 mt-2">Digital Content Specialists</SelectLabel>
                  <SelectItem value="Main Editor / Videographer" className="data-[highlighted]:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors cursor-pointer pl-6 py-2">
                    Main Editor / Videographer
                  </SelectItem>
                  <SelectItem value="Assistant Editor" className="data-[highlighted]:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors cursor-pointer pl-6 py-2">
                    Assistant Editor
                  </SelectItem>
                  <SelectItem value="Assistant Videographer" className="data-[highlighted]:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors cursor-pointer pl-6 py-2">
                    Assistant Videographer
                  </SelectItem>
                  <SelectItem value="Sound Engineer" className="data-[highlighted]:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors cursor-pointer pl-6 py-2">
                    Sound Engineer
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
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
                <button
                  type="button"
                  onClick={() => setRemoveTarget(assignment)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No team members assigned yet.</p>
          )}
        </div>
        {removeState?.message && <p className="text-sm text-red-500 mt-2">{removeState.message}</p>}
      </div>

      {/* One hidden form drives whichever removal was confirmed, so the dialog owns the decision. */}
      <form ref={removeFormRef} action={removeFormAction} className="hidden">
        <input type="hidden" name="assignmentId" value={removeTarget?.id ?? ''} />
        <input type="hidden" name="projectId" value={projectId} />
      </form>

      <ConfirmationModal
        isOpen={pendingAssign !== null}
        onClose={() => setPendingAssign(null)}
        onConfirm={confirmAssign}
        title={`Make ${pendingName} the main editor?`}
        variant={reassignAll ? 'danger' : 'warning'}
        confirmText={reassignAll ? `Reassign all ${creditBreakdown.total} videos` : 'Assign'}
        wide
        description={
          <>
            <p>
              Editing credit in analytics comes from each video individually, so this decides who
              gets credited for the work on this project.
            </p>
            <ul className="space-y-1.5 rounded-lg bg-gray-50 p-3 text-gray-700">
              <li>
                <span className="font-semibold text-gray-900">{creditBreakdown.noEditor}</span> of{' '}
                {creditBreakdown.total} videos have no editor yet — these will be credited to{' '}
                <span className="font-medium text-gray-900">{pendingName}</span>.
              </li>
              {alreadyTheirs > 0 && (
                <li>
                  <span className="font-semibold text-gray-900">{alreadyTheirs}</span>{' '}
                  {alreadyTheirs === 1 ? 'video is' : 'videos are'} already credited to them.
                </li>
              )}
              {othersCredited.length > 0 && (
                <li>
                  <span className="font-semibold text-gray-900">{othersTotal}</span>{' '}
                  {othersTotal === 1 ? 'video is' : 'videos are'} credited to someone else (
                  {othersCredited.map(([id, count]) => `${nameOf(id)} — ${count}`).join(', ')}) and
                  will be <span className="font-medium">left unchanged</span>.
                </li>
              )}
              {creditBreakdown.noEditor === 0 && othersCredited.length === 0 && alreadyTheirs === 0 && (
                <li>This project has no videos yet, so nothing changes until videos are added.</li>
              )}
            </ul>
            {creditBreakdown.noEditor === 0 && othersTotal > 0 && !reassignAll && (
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
                Every video already has an editor, so <strong>{pendingName}</strong> would be credited
                with nothing. Tick the box below if this is a hand-over.
              </p>
            )}
          </>
        }
      >
        {othersTotal > 0 && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 p-3 text-sm hover:bg-gray-50">
            <input
              type="checkbox"
              checked={reassignAll}
              onChange={e => setReassignAll(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300"
            />
            <span className="text-gray-700">
              <span className="font-medium text-gray-900">
                Also reassign the {othersTotal} {othersTotal === 1 ? 'video' : 'videos'} credited to
                someone else
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Use this for a hand-over. It moves credit for work {othersCredited.map(([id]) => nameOf(id)).join(', ')}{' '}
                may have already done, and cannot be undone from here — each video would have to be
                set back by hand.
              </span>
            </span>
          </label>
        )}
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        title={`Remove ${removeTarget?.profiles?.full_name ?? 'this member'}?`}
        variant="danger"
        confirmText="Remove"
        description={
          <>
            <p>
              This removes their <span className="font-medium text-gray-900">{removeTarget?.role}</span>{' '}
              assignment on this project.
            </p>
            {removeTarget?.role === MAIN_EDITOR_ROLE && (
              removeVideoCount > 0 ? (
                <p className="rounded-lg bg-gray-50 p-3 text-gray-700">
                  {removeVideoCount} {removeVideoCount === 1 ? 'video stays' : 'videos stay'} credited
                  to them, which is deliberate — they may have done that work. To move the credit,
                  assign a new main editor and tick the reassign option, or change the editor on each
                  video.
                </p>
              ) : (
                <p className="rounded-lg bg-gray-50 p-3 text-gray-700">
                  No video is credited to them, so no editing credit changes.
                </p>
              )
            )}
          </>
        }
      />
    </div>
  );
}