// src/app/admin/faculties/FacultyList.tsx
'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton'; // Import our new component

// ... (the type definitions at the top remain the same)
type Faculty = { id: number; name: string; };
type FacultyListProps = { faculties: Faculty[]; deleteFaculty: (formData: FormData) => Promise<void>; updateFaculty: (formData: FormData) => Promise<void>; };

export default function FacultyList({ faculties, deleteFaculty, updateFaculty }: FacultyListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <ul className="space-y-2 mt-2">
      {faculties.map((faculty) => (
        <li key={faculty.id} className="p-3 border rounded-md bg-white flex justify-between items-center">
          {editingId === faculty.id ? (
            // EDITING STATE
            <form action={updateFaculty} onSubmit={() => setEditingId(null)} className="flex-grow flex items-center">
              <input type="hidden" name="id" value={faculty.id} />
              <input
                type="text"
                name="name"
                defaultValue={faculty.name}
                className="flex-grow border-gray-300 rounded-md shadow-sm p-2"
                autoFocus
              />
              {/* Use SubmitButton for the Save action */}
              <SubmitButton className="ml-2 px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                Save
              </SubmitButton>
              <button onClick={() => setEditingId(null)} type="button" className="ml-2 px-3 py-1 text-sm">
                Cancel
              </button>
            </form>
          ) : (
            // DEFAULT STATE
            <>
              <span>{faculty.name}</span>
              <div className="flex items-center space-x-2">
                <button onClick={() => setEditingId(faculty.id)} className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">
                  Edit
                </button>
                <form 
                  action={deleteFaculty}
                  onSubmit={(e) => {
                    if (!confirm('Are you sure you want to delete this item?')) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={faculty.id} />
                  {/* Use SubmitButton for the Delete action */}
                  <SubmitButton 
                    className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:bg-gray-100"
                    pendingText="Deleting..."
                  >
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}