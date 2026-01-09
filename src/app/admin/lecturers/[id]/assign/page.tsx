// src/app/admin/lecturers/[id]/assign/page.tsx
import { createClient } from '@/lib/supabase/server';
import { updateLecturerAssignments } from './actions';
import SubmitButton from '@/components/SubmitButton';
import Link from 'next/link';

export const revalidate = 0;

export default async function AssignProgramsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  const lecturerId = parseInt(id);

  const lecturerPromise = supabase.from('lecturers').select('id, name').eq('id', lecturerId).single();
  const allFacultiesPromise = supabase.from('faculties').select('id, name').order('name');
  const assignmentsPromise = supabase.from('lecturer_faculty_join').select('faculty_id').eq('lecturer_id', lecturerId);

  const [
    { data: lecturer },
    { data: allFaculties },
    { data: assignmentsData }
  ] = await Promise.all([lecturerPromise, allFacultiesPromise, assignmentsPromise]);

  const assignedFacultyIds = new Set(assignmentsData?.map(a => a.faculty_id));
  const updateAssignmentsWithId = updateLecturerAssignments.bind(null, lecturerId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Assign Faculties</h1>
      <p className="text-gray-600 mb-4">For Lecturer: <span className="font-semibold">{lecturer?.name}</span></p>

      <form action={updateAssignmentsWithId}>
        <div className="border rounded-lg p-4 bg-white">
          <div className="space-y-3">
            {allFaculties?.map(faculty => (
              <div key={faculty.id} className="relative flex items-start ml-2">
                <div className="flex h-6 items-center">
                  <input
                    id={`faculty-${faculty.id}`}
                    name="faculty_id"
                    type="checkbox"
                    value={faculty.id}
                    defaultChecked={assignedFacultyIds.has(faculty.id)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-600"
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label htmlFor={`faculty-${faculty.id}`} className="font-medium text-gray-900">
                    {faculty.name}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/admin/lecturers" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
            Cancel
          </Link>
          <SubmitButton
            className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md shadow-sm hover:bg-gray-700 disabled:bg-gray-400"
            pendingText="Saving..."
          >
            Save Assignments
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}