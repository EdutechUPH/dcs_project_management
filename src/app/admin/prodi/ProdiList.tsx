// src/app/admin/prodi/ProdiList.tsx
'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton'; // Import the button

// ... (type definitions remain the same)
type Faculty = { id: number; name: string; };
type Prodi = { id: number; name: string; faculty_id: number; faculties: { name: string } | null; };
type ProdiListProps = { prodi: Prodi[]; faculties: Faculty[]; deleteProdi: (formData: FormData) => Promise<void>; updateProdi: (formData: FormData) => Promise<void>; };


export default function ProdiList({ prodi, faculties, deleteProdi, updateProdi }: ProdiListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <ul className="space-y-2 mt-2">
      {prodi.map((program) => (
        <li key={program.id} className="p-3 border rounded-md bg-white flex justify-between items-center">
          {editingId === program.id ? (
            // EDITING STATE
            <form action={updateProdi} onSubmit={() => setEditingId(null)} className="flex-grow flex items-center gap-2">
              <input type="hidden" name="id" value={program.id} />
              <input
                type="text"
                name="name"
                defaultValue={program.name}
                className="flex-grow border-gray-300 rounded-md shadow-sm p-2"
                autoFocus
              />
              <select
                name="faculty_id"
                defaultValue={program.faculty_id}
                className="border-gray-300 rounded-md shadow-sm p-2"
              >
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
              <SubmitButton className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                Save
              </SubmitButton>
              <button onClick={() => setEditingId(null)} type="button" className="text-sm">
                Cancel
              </button>
            </form>
          ) : (
            // DEFAULT STATE
            <>
              <div>
                <p className="font-semibold">{program.name}</p>
                <p className="text-sm text-gray-500">
                  Faculty: {program.faculties ? program.faculties.name : 'N/A'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setEditingId(program.id)} className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">
                  Edit
                </button>
                <form 
                  action={deleteProdi}
                  onSubmit={(e) => {
                    if (!confirm('Are you sure you want to delete this item?')) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={program.id} />
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