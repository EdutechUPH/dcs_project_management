// src/app/admin/terms/TermList.tsx
'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton';

type Term = { id: number; name: string };
type TermListProps = {
  terms: Term[];
  deleteTerm: (formData: FormData) => Promise<void>;
  updateTerm: (formData: FormData) => Promise<void>;
};

export default function TermList({ terms, deleteTerm, updateTerm }: TermListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <ul className="space-y-2 mt-2">
      {terms.map((term) => (
        <li key={term.id} className="p-3 border rounded-md bg-white flex justify-between items-center">
          {editingId === term.id ? (
            <form action={updateTerm} onSubmit={() => setEditingId(null)} className="flex-grow flex items-center gap-2">
              <input type="hidden" name="id" value={term.id} />
              <input type="text" name="name" defaultValue={term.name} className="flex-grow border-gray-300 rounded-md shadow-sm p-2" required autoFocus />
              <SubmitButton className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400">Save</SubmitButton>
              <button onClick={() => setEditingId(null)} type="button" className="text-sm">Cancel</button>
            </form>
          ) : (
            <>
              <span>{term.name}</span>
              <div className="flex items-center space-x-2">
                <button onClick={() => setEditingId(term.id)} className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">Edit</button>
                <form action={deleteTerm} onSubmit={(e) => { if (!confirm('Are you sure?')) e.preventDefault(); }}>
                  <input type="hidden" name="id" value={term.id} />
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