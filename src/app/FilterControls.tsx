// src/app/FilterControls.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

type FilterControlsProps = {
  faculties: { id: number; name: string }[];
  terms: { id: number; name: string }[];
  teamMembers: { id: number; name: string }[]; // Add team members prop
};

export default function FilterControls({ faculties, terms, teamMembers }: FilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label htmlFor="faculty" className="block text-sm font-medium text-gray-700">Filter by Faculty</label>
        <select
          id="faculty"
          name="faculty"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          onChange={(e) => router.push(pathname + '?' + createQueryString('faculty', e.target.value))}
          defaultValue={searchParams.get('faculty') || ''}
        >
          <option value="">All Faculties</option>
          {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="term" className="block text-sm font-medium text-gray-700">Filter by Term</label>
        <select
          id="term"
          name="term"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          onChange={(e) => router.push(pathname + '?' + createQueryString('term', e.target.value))}
          defaultValue={searchParams.get('term') || ''}
        >
          <option value="">All Terms</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {/* NEW Filter by Team Member */}
      <div>
        <label htmlFor="teamMember" className="block text-sm font-medium text-gray-700">Filter by Team Member</label>
        <select
          id="teamMember"
          name="teamMember"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          onChange={(e) => router.push(pathname + '?' + createQueryString('teamMember', e.target.value))}
          defaultValue={searchParams.get('teamMember') || ''}
        >
          <option value="">All Members</option>
          {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
    </div>
  );
}