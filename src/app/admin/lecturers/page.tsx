// src/app/admin/lecturers/page.tsx
import { createClient } from '@/lib/supabase/server';
import LecturerList from './LecturerList';
import { addLecturer, deleteLecturer, updateLecturer } from './actions';
import SubmitButton from '@/components/SubmitButton';

export const revalidate = 0;

export default async function LecturersPage() {
  const supabase = createClient();
  // UPDATED QUERY: We are now joining through 'lecturer_prodi_join'
  // to get the name of each assigned study program.
  const { data: lecturers, error } = await supabase
    .from('lecturers')
    .select('*, lecturer_prodi_join(prodi(name))')
    .order('name', { ascending: true });
    
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Lecturers</h1>
      {/* The form remains the same */}
      <form action={addLecturer} className="mb-6 p-4 border rounded-md bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Lecturer Name</label>
          <input type="text" name="name" id="name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" required />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" name="email" id="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
        </div>
        <SubmitButton className="bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700 disabled:bg-gray-400" pendingText="Saving...">Save Lecturer</SubmitButton>
      </form>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Existing Lecturers</h2>
        <LecturerList lecturers={lecturers ?? []} deleteLecturer={deleteLecturer} updateLecturer={updateLecturer} />
      </div>
    </div>
  );
}