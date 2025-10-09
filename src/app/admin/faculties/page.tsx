// src/app/admin/faculties/page.tsx
import { createClient } from '@/lib/supabase/server'; // Use the server helper
import FacultyList from './FacultyList';
import { addFaculty, deleteFaculty, updateFaculty } from './actions';

export const revalidate = 0;

export default async function FacultiesPage() {
  const supabase = await createClient(); // Create the client instance

  const { data: faculties, error } = await supabase
    .from('faculties')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return <p>Error fetching faculties: {error.message}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Faculties</h1>
      
      <form action={addFaculty} className="mb-6 p-4 border rounded-md bg-gray-50">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">New Faculty Name</label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            name="name"
            id="name"
            className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            placeholder="e.g., School of Design"
            required
          />
          {/* Note: This button should be updated to use our reusable SubmitButton */}
          <button type="submit" className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Save Faculty
          </button>
        </div>
      </form>

      <div className="mt-4">
        <h2 className="text-lg font-semibold">Existing Faculties</h2>
        <FacultyList 
          faculties={faculties ?? []} 
          deleteFaculty={deleteFaculty} 
          updateFaculty={updateFaculty}
        />
      </div>
    </div>
  );
}