// src/app/admin/lecturers/LecturerList.tsx
'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton';
import Link from 'next/link';

// UPDATED TYPE to include the nested program data
type Lecturer = { 
  id: number; 
  name: string; 
  email: string | null;
  lecturer_prodi_join: {
    prodi: {
      name: string;
    } | null
  }[];
};

type LecturerListProps = {
  lecturers: Lecturer[];
  deleteLecturer: (formData: FormData) => Promise<void>;
  updateLecturer: (formData: FormData) => Promise<void>;
};

export default function LecturerList({ lecturers, deleteLecturer, updateLecturer }: LecturerListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <ul className="space-y-2 mt-2">
      {lecturers.map((lecturer) => (
        <li key={lecturer.id} className="p-3 border rounded-md bg-white flex justify-between items-center">
          {editingId === lecturer.id ? (
            // ... (editing form remains the same)
            <form action={updateLecturer} onSubmit={() => setEditingId(null)} className="flex-grow flex items-center gap-2">
              <input type="hidden" name="id" value={lecturer.id} />
              <input type="text" name="name" defaultValue={lecturer.name} className="flex-grow border-gray-300 rounded-md shadow-sm p-2" required autoFocus />
              <input type="email" name="email" defaultValue={lecturer.email ?? ''} className="flex-grow border-gray-300 rounded-md shadow-sm p-2" placeholder="Email (optional)" />
              <SubmitButton className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400">Save</SubmitButton>
              <button onClick={() => setEditingId(null)} type="button" className="text-sm">Cancel</button>
            </form>
          ) : (
            <>
              <div>
                <p className="font-semibold">{lecturer.name}</p>
                <p className="text-sm text-gray-500">{lecturer.email}</p>
                {/* NEW: Display assigned programs as badges */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {lecturer.lecturer_prodi_join.map((join, index) => join.prodi && (
                    <span key={index} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {join.prodi.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link href={`/admin/lecturers/${lecturer.id}/assign`} className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                  Manage Programs
                </Link>
                <button onClick={() => setEditingId(lecturer.id)} className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">Edit</button>
                <form action={deleteLecturer} onSubmit={(e) => { if (!confirm('Are you sure?')) e.preventDefault(); }}>
                  <input type="hidden" name="id" value={lecturer.id} />
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