// src/app/projects/new/AddLecturerModal.tsx
'use client';

import { addLecturer } from '@/app/admin/lecturers/actions';
import SubmitButton from '@/components/SubmitButton';
import { MultiSelect } from '@/components/MultiSelect';
import { useRef, useState, useTransition } from 'react';

type AddLecturerModalProps = {
  prodi: { id: number, name: string }[];
  onClose: () => void;
  onLecturerAdded: () => void;
};

export default function AddLecturerModal({ prodi, onClose, onLecturerAdded }: AddLecturerModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // State for the multi-select dropdown
  const [selectedProdi, setSelectedProdi] = useState<string[]>([]);

  const prodiOptions = prodi.map(p => ({ value: p.id.toString(), label: p.name }));

  const handleSubmit = async (formData: FormData) => {
    // Append the selected program IDs to the form data before submitting
    selectedProdi.forEach(prodiId => {
      formData.append('prodi_ids', prodiId);
    });

    startTransition(async () => {
      const result = await addLecturer({ error: null, data: null }, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        formRef.current?.reset();
        onLecturerAdded();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Lecturer</h2>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="name" id="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Optional)</label>
            <input type="email" name="email" id="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign to Study Program(s)</label>
            <MultiSelect 
              options={prodiOptions}
              selected={selectedProdi}
              onChange={setSelectedProdi}
              placeholder="Select programs..."
              className="mt-1"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancel
            </button>
            <SubmitButton 
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md shadow-sm hover:bg-gray-700 disabled:bg-gray-400"
              pendingText="Saving..."
            >
              Save Lecturer
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}