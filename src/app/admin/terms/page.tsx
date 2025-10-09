// src/app/admin/terms/page.tsx
import { createClient } from '@/lib/supabase/server';
import TermList from './TermList';
import { addTerm, deleteTerm, updateTerm } from './actions';
import SubmitButton from '@/components/SubmitButton';

export const revalidate = 0;

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: terms, error } = await supabase.from('terms').select('*').order('name', { ascending: true });
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Terms</h1>
      <form action={addTerm} className="mb-6 p-4 border rounded-md bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Term Name</label>
          <input type="text" name="name" id="name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" placeholder="e.g., 1241" required />
        </div>
        <div className="md:col-span-1">
          <SubmitButton className="w-full bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700 disabled:bg-gray-400" pendingText="Saving...">Save Term</SubmitButton>
        </div>
      </form>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Existing Terms</h2>
        <TermList terms={terms ?? []} deleteTerm={deleteTerm} updateTerm={updateTerm} />
      </div>
    </div>
  );
}