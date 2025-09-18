// src/app/projects/new/page.tsx
import { createClient } from '@/lib/supabase/server';
import ProjectRequestForm from './ProjectRequestForm'; // Import our new form component

export const revalidate = 0;

export default async function NewProjectPage() {
  const supabase = createClient();
  // Fetch all necessary data for dropdowns in parallel
  const [
    { data: terms },
    { data: faculties },
    { data: prodi },
    { data: lecturers }
  ] = await Promise.all([
    supabase.from('terms').select('*').order('name'),
    supabase.from('faculties').select('*').order('name'),
    supabase.from('prodi').select('*').order('name'),
    supabase.from('lecturers').select('*').order('name')
  ]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">New Project Request</h1>
      <ProjectRequestForm 
        terms={terms ?? []}
        faculties={faculties ?? []}
        prodi={prodi ?? []}
        lecturers={lecturers ?? []}
      />
    </div>
  );
}