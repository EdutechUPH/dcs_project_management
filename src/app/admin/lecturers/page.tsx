// src/app/admin/lecturers/page.tsx
import { createClient } from '@/lib/supabase/server';
import LecturerList from './LecturerList';
import AddLecturerForm from './AddLecturerForm';
// Import the actions we need to pass down
import { deleteLecturer, updateLecturer } from './actions';

export const revalidate = 0;

export default async function LecturersPage() {
  const supabase = await createClient();

  const { data: lecturers, error } = await supabase.from('lecturers').select('*, lecturer_faculty_join(faculties(name))').order('name', { ascending: true });
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Lecturers</h1>

      <AddLecturerForm />

      <div className="mt-4">
        <h2 className="text-lg font-semibold">Existing Lecturers</h2>
        {/* Pass the imported actions as props */}
        <LecturerList
          lecturers={lecturers ?? []}
          deleteLecturer={deleteLecturer}
          updateLecturer={updateLecturer}
        />
      </div>
    </div>
  );
}