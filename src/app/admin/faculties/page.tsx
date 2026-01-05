import { createClient } from '@/lib/supabase/server';
import { addFaculty, deleteFaculty } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { EditFacultyModal } from './EditFacultyModal';

export default async function FacultiesPage() {
  const supabase = await createClient();
  const { data: faculties } = await supabase.from('faculties').select('*').order('name');

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">← Back to Admin</Link>
        <h1 className="text-3xl font-bold mt-2">Manage Faculties</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* List */}
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-700">Existing Faculties</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {faculties?.map((f) => (
              <li key={f.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                <div className="flex flex-col">
                  <span className="font-medium">{f.name}</span>
                  <span className="text-xs text-gray-500">{f.short_name ? `Short: ${f.short_name}` : 'No short name'}</span>
                </div>
                <div className="flex gap-1">
                  <EditFacultyModal faculty={f} />
                  <form action={async () => {
                    'use server';
                    await deleteFaculty(f.id);
                  }}>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </li>
            ))}
            {faculties?.length === 0 && <li className="p-4 text-gray-400 text-center italic">No faculties found.</li>}
          </ul>
        </div>

        {/* Add Form */}
        <div className="h-fit bg-white border rounded-lg p-6 shadow-sm sticky top-8">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Faculty</h3>
          <form action={addFaculty} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Faculty Name</label>
              <Input name="name" placeholder="e.g. Business School" required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Short Name (for Charts)</label>
              <Input name="short_name" placeholder="e.g. UPH-BS" className="mt-1" />
            </div>
            <Button type="submit">Add</Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Note: Deleting a faculty currently assigned to projects may cause data inconsistencies.
          </p>
        </div>
      </div>
    </div>
  );
}