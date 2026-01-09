// src/app/analytics/AnalyticsFilters.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { CheckboxFilter } from '@/components/CheckboxFilter';

type Option = { value: string; label: string; };

type FilterControlsProps = {
  faculties: Option[];
  prodi: Option[];
  lecturers: Option[];
  terms: Option[];
  editors: Option[];
};

export default function AnalyticsFilters({ faculties, prodi, lecturers, terms, editors }: FilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State for all our filters
  const [date, setDate] = useState<DateRange | undefined>({
    from: searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined,
    to: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
  });
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>(searchParams.get('faculties')?.split(',') || []);
  const [selectedProdi, setSelectedProdi] = useState<string[]>(searchParams.get('prodi')?.split(',') || []);
  const [selectedLecturers, setSelectedLecturers] = useState<string[]>(searchParams.get('lecturers')?.split(',') || []);
  const [selectedTerms, setSelectedTerms] = useState<string[]>(searchParams.get('terms')?.split(',') || []);
  const [selectedEditors, setSelectedEditors] = useState<string[]>(searchParams.get('editors')?.split(',') || []);
  const [groupBy, setGroupBy] = useState(searchParams.get('groupBy') || 'faculty');

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Update params from state
    params.set('groupBy', groupBy);
    if (date?.from) params.set('from', format(date.from, 'yyyy-MM-dd')); else params.delete('from');
    if (date?.to) params.set('to', format(date.to, 'yyyy-MM-dd')); else params.delete('to');
    if (selectedFaculties.length > 0) params.set('faculties', selectedFaculties.join(',')); else params.delete('faculties');
    if (selectedProdi.length > 0) params.set('prodi', selectedProdi.join(',')); else params.delete('prodi');
    if (selectedLecturers.length > 0) params.set('lecturers', selectedLecturers.join(',')); else params.delete('lecturers');
    if (selectedTerms.length > 0) params.set('terms', selectedTerms.join(',')); else params.delete('terms');
    if (selectedEditors.length > 0) params.set('editors', selectedEditors.join(',')); else params.delete('editors');

    startTransition(() => {
      router.push(pathname + '?' + params.toString());
    });
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CheckboxFilter title="Faculties" options={faculties} selected={selectedFaculties} onChange={setSelectedFaculties} />
        <CheckboxFilter title="Study Programs" options={prodi} selected={selectedProdi} onChange={setSelectedProdi} />
        <CheckboxFilter title="Lecturers" options={lecturers} selected={selectedLecturers} onChange={setSelectedLecturers} />
        <CheckboxFilter title="Terms" options={terms} selected={selectedTerms} onChange={setSelectedTerms} />
        <CheckboxFilter title="Main Editors" options={editors} selected={selectedEditors} onChange={setSelectedEditors} />
        <div>
          <select
            id="groupBy"
            name="groupBy"
            className="block w-full rounded-md border-gray-300 shadow-sm p-2 h-10"
            onChange={(e) => setGroupBy(e.target.value)}
            value={groupBy}
          >
            <option value="faculty">Group By Faculty</option>
            <option value="prodi">Group By Program</option>
            <option value="lecturer">Group By Lecturer</option>
            <option value="term">Group By Term</option>
            <option value="editor">Group By Editor</option>
            <option value="type">Group By Work Type</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date Range (Project Creation Date)</label>
          <DayPicker mode="range" selected={date} onSelect={setDate} className="bg-white p-2 rounded-md border" />
        </div>
        <button onClick={handleApplyFilters} className="bg-gray-800 text-white rounded-md shadow-sm h-10 px-4 hover:bg-gray-700 disabled:opacity-50" disabled={isPending}>
          {isPending ? 'Applying...' : 'Apply Filters'}
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            // Ensure state matches what's used if we want to export *current selection* regardless of apply? 
            // Better to use current URL params (searchParams) to ensure what you see is what you export.
            // But wait, the user changes dropdowns then clicks export. They expect those dropdowns to apply.
            // So we should rebuild params from state like handleApplyFilters does.

            const exportParams = new URLSearchParams();
            if (date?.from) exportParams.set('from', format(date.from, 'yyyy-MM-dd'));
            if (date?.to) exportParams.set('to', format(date.to, 'yyyy-MM-dd'));
            if (selectedFaculties.length > 0) exportParams.set('faculties', selectedFaculties.join(','));
            if (selectedProdi.length > 0) exportParams.set('prodi', selectedProdi.join(','));
            if (selectedLecturers.length > 0) exportParams.set('lecturers', selectedLecturers.join(','));
            if (selectedTerms.length > 0) exportParams.set('terms', selectedTerms.join(','));
            if (selectedEditors.length > 0) exportParams.set('editors', selectedEditors.join(','));

            window.open(`/api/analytics/export?${exportParams.toString()}`, '_blank');
          }}
          className="bg-green-600 text-white rounded-md shadow-sm h-10 px-4 hover:bg-green-700 disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}