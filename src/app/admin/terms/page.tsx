import { createClient } from '@/lib/supabase/server';
import { addTerm, deleteTerm } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: terms } = await supabase.from('terms').select('*').order('name');

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">← Back to Admin</Link>
        <h1 className="text-3xl font-bold mt-2">Manage Terms</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* List */}
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-700">Existing Terms</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {terms?.map((t) => (
              <li key={t.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                <span>{t.name}</span>
                <form action={async () => {
                  'use server';
                  await deleteTerm(t.id);
                }}>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </form>
              </li>
            ))}
            {terms?.length === 0 && <li className="p-4 text-gray-400 text-center italic">No terms found.</li>}
          </ul>
        </div>

        {/* Add Form */}
        <div className="h-fit bg-white border rounded-lg p-6 shadow-sm sticky top-8">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Term</h3>
          <form action={addTerm} className="flex gap-2">
            <Input name="name" placeholder="e.g. Term 1 2024" required />
            <Button type="submit">Add</Button>
          </form>
        </div>
      </div>
    </div>
  );
}