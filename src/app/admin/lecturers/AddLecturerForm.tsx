// src/app/admin/lecturers/AddLecturerForm.tsx
'use client';

import { useActionState } from 'react';
import { addLecturer } from './actions';
import SubmitButton from '@/components/SubmitButton';

const initialState = {
  error: null,
  data: null,
};

export default function AddLecturerForm() {
  // Note: addLecturer now returns an object, so we use useActionState
  const [state, formAction] = useActionState(addLecturer, initialState);

  return (
    <form action={formAction} className="mb-6 p-4 border rounded-md bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Lecturer Name</label>
        <input type="text" name="name" id="name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" required />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" name="email" id="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
      </div>
      <SubmitButton className="bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700 disabled:bg-gray-400" pendingText="Saving...">Save Lecturer</SubmitButton>
      {state?.error && <p className="text-sm text-red-500 md:col-span-3">{state.error}</p>}
    </form>
  );
}