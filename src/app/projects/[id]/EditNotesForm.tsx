// src/app/projects/[id]/EditNotesForm.tsx
'use client';

import { useState } from 'react';
import { updateProjectNotes } from './actions';
import SubmitButton from '@/components/SubmitButton';

type EditNotesFormProps = {
  projectId: number;
  notes: string | null;
};

export default function EditNotesForm({ projectId, notes }: EditNotesFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Bind the projectId to the server action
  const updateNotesWithId = updateProjectNotes.bind(null, projectId);

  if (isEditing) {
    return (
      <form action={updateNotesWithId} onSubmit={() => setIsEditing(false)}>
        <dt className="text-sm font-medium text-gray-500">Notes</dt>
        <textarea
          name="notes"
          defaultValue={notes || ''}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          autoFocus
        />
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={() => setIsEditing(false)} className="text-sm font-medium text-gray-600">
            Cancel
          </button>
          <SubmitButton 
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            pendingText="Saving..."
          >
            Save
          </SubmitButton>
        </div>
      </form>
    );
  }

  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">Notes</dt>
      <dd className="mt-1 text-lg text-gray-900 whitespace-pre-wrap">{notes || 'N/A'}</dd>
      <button onClick={() => setIsEditing(true)} className="mt-2 text-sm text-blue-600 hover:underline">
        Edit Notes
      </button>
    </div>
  );
}