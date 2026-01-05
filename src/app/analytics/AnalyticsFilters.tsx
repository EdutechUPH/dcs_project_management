// src/app/analytics/AnalyticsFilters.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { MultiSelect } from '@/components/MultiSelect';

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
        <MultiSelect options={faculties} selected={selectedFaculties} onChange={setSelectedFaculties} placeholder="Filter Faculties..." />
        <MultiSelect options={prodi} selected={selectedProdi} onChange={setSelectedProdi} placeholder="Filter Study Programs..." />
        <MultiSelect options={lecturers} selected={selectedLecturers} onChange={setSelectedLecturers} placeholder="Filter Lecturers..." />
        <MultiSelect options={terms} selected={selectedTerms} onChange={setSelectedTerms} placeholder="Filter Terms..." />
        <MultiSelect options={editors} selected={selectedEditors} onChange={setSelectedEditors} placeholder="Filter Main Editors..." />
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
      </div>
    </div>
  );
}