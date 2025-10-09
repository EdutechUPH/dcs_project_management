// src/app/admin/prodi/page.tsx
import { createClient } from '@/lib/supabase/server';
import ProdiList from './ProdiList';
import { addProdi, deleteProdi, updateProdi } from './actions';
import SubmitButton from '@/components/SubmitButton'; // Import the button

export const revalidate = 0;

export default async function ProdiPage() {
  const supabase = await createClient();
  const prodiPromise = supabase.from('prodi').select('*, faculties(name)').order('name', { ascending: true });
  const facultiesPromise = supabase.from('faculties').select('*').order('name', { ascending: true });

  const [{ data: prodi, error: prodiError }, { data: faculties, error: facultiesError }] = await Promise.all([prodiPromise, facultiesPromise]);

  if (prodiError || facultiesError) {
    return <p>Error fetching data: {prodiError?.message || facultiesError?.message}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Study Programs</h1>
      
      <form action={addProdi} className="mb-6 p-4 border rounded-md bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">New Program Name</label>
          <input
            type="text"
            name="name"
            id="name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="faculty_id" className="block text-sm font-medium text-gray-700">Faculty</label>
          <select
            name="faculty_id"
            id="faculty_id"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            required
          >
            <option value="">Select a Faculty</option>
            {faculties?.map(faculty => (
              <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
            ))}
          </select>
        </div>
        {/* Use the SubmitButton component */}
        <SubmitButton 
          className="bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700 disabled:bg-gray-400"
          pendingText="Saving..."
        >
          Save Program
        </SubmitButton>
      </form>

      <div className="mt-4">
        <h2 className="text-lg font-semibold">Existing Programs</h2>
        <ProdiList 
          prodi={prodi ?? []} 
          faculties={faculties ?? []}
          deleteProdi={deleteProdi}
          updateProdi={updateProdi}
        />
      </div>
    </div>
  );
}