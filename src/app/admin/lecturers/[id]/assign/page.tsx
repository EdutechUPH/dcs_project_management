// src/app/admin/lecturers/[id]/assign/page.tsx
import { createClient } from '@/lib/supabase/server';
import { updateLecturerAssignments } from './actions';
import SubmitButton from '@/components/SubmitButton';
import Link from 'next/link';

export const revalidate = 0;

export default async function AssignProgramsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const lecturerId = parseInt(params.id);

  const lecturerPromise = supabase.from('lecturers').select('id, name').eq('id', lecturerId).single();
  const allProdiPromise = supabase.from('prodi').select('id, name, faculty_id').order('name');
  const allFacultiesPromise = supabase.from('faculties').select('id, name');
  const assignmentsPromise = supabase.from('lecturer_prodi_join').select('prodi_id').eq('lecturer_id', lecturerId);

  const [
    { data: lecturer },
    { data: allProdi },
    { data: allFaculties },
    { data: assignmentsData }
  ] = await Promise.all([lecturerPromise, allProdiPromise, allFacultiesPromise, assignmentsPromise]);

  const assignedProdiIds = new Set(assignmentsData?.map(a => a.prodi_id));
  const updateAssignmentsWithId = updateLecturerAssignments.bind(null, lecturerId);

  type Prodi = { id: number; name: string; faculty_id: number; };

  const groupedProdi = allFaculties?.reduce((acc, faculty) => {
    const programsInFaculty = allProdi?.filter(p => p.faculty_id === faculty.id) || [];
    if (programsInFaculty.length > 0) {
      acc[faculty.name] = programsInFaculty;
    }
    return acc;
  }, {} as Record<string, Prodi[]>);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Assign Study Programs</h1>
      <p className="text-gray-600 mb-4">For Lecturer: <span className="font-semibold">{lecturer?.name}</span></p>
      
      <form action={updateAssignmentsWithId}>
        <div className="border rounded-lg p-4 bg-white">
          {groupedProdi && Object.keys(groupedProdi).map(facultyName => (
            <div key={facultyName} className="mb-4">
              <h3 className="font-semibold text-gray-800 border-b pb-1 mb-2">{facultyName}</h3>
              <div className="space-y-3">
                {/* THE FIX IS HERE: Add a '?' for optional chaining */}
                {groupedProdi[facultyName]?.map(prodi => (
                  <div key={prodi.id} className="relative flex items-start ml-2">
                    <div className="flex h-6 items-center">
                      <input
                        id={`prodi-${prodi.id}`}
                        name="prodi_id"
                        type="checkbox"
                        value={prodi.id}
                        defaultChecked={assignedProdiIds.has(prodi.id)}
                        className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-600"
                      />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor={`prodi-${prodi.id}`} className="font-medium text-gray-900">
                        {prodi.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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