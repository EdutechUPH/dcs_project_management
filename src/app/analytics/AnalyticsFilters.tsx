// src/app/analytics/AnalyticsFilters.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { CheckboxFilter } from '@/components/CheckboxFilter';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, FilterX, Download } from 'lucide-react';
import { cn } from "@/lib/utils";

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

  const applyFilters = () => {
    // Logic duplicated to ensure button click applies exactly what is in state
    const params = new URLSearchParams(searchParams.toString());
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
  }

  const handleApplyFilters = () => {
    applyFilters();
  };

  const handleClearAll = () => {
    setDate(undefined);
    setSelectedFaculties([]);
    setSelectedProdi([]);
    setSelectedLecturers([]);
    setSelectedTerms([]);
    setSelectedEditors([]);
    // Keep GroupBy as it is view preference, not filter? Or reset to faculty? User said "Clear Filter", usually implies data narrowing.
    // Let's keep groupBy.

    // Auto-apply or wait for Apply button?
    // Better UX to reset local state and user must click Apply? Or auto-apply?
    // "Clear All" usually implies immediately clearing. Let's startTransition immediately.
    startTransition(() => {
      router.push(pathname);
    });
  };

  // Helper to sync local state change with auto-apply? 
  // User requested "control bar", typically these auto-apply or have a floating bar.
  // Given the previous design had "Apply", let's keep "Apply" for heavy queries, but maybe visually denote "Unsaved changes"?
  // For now, sticking to manual "Apply" is safer for performance, but the new design looks like immediate controls.
  // I'll keep the manual Apply button but make it prominent if dirty? No, simpler: Keep Apply.

  return (
    <div className="mb-6 p-4 border rounded-xl bg-white shadow-sm space-y-4">
      {/* Control Bar Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

        {/* Left: Group By & Date */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="w-[180px]">
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Group by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="faculty">Group By Faculty</SelectItem>
                <SelectItem value="prodi">Group By Program</SelectItem>
                <SelectItem value="lecturer">Group By Lecturer</SelectItem>
                <SelectItem value="term">Group By Term</SelectItem>
                <SelectItem value="editor">Group By Editor</SelectItem>
                <SelectItem value="type">Group By Work Type</SelectItem>
              </SelectContent>
            </Select>
          </div>



          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "h-9 justify-start text-left font-normal w-[240px]",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "d MMM y")} -{" "}
                      {format(date.to, "d MMM y")}
                    </>
                  ) : (
                    format(date.from, "d MMM y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
              {date && (
                <div className="p-2 border-t flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDate(undefined)}
                    className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear Dates
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-9 text-gray-500 hover:text-red-600">
            <FilterX className="mr-2 h-4 w-4" />
            Clear All
          </Button>
          <Button onClick={handleApplyFilters} disabled={isPending} className="h-9">
            {isPending ? 'Applying...' : 'Apply Filters'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 text-green-600 border-green-200 hover:bg-green-50"
            title="Export CSV"
            onClick={() => {
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
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Pills Row */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed">
        <CheckboxFilter title="Faculties" options={faculties} selected={selectedFaculties} onChange={setSelectedFaculties} />
        <CheckboxFilter title="Programs" options={prodi} selected={selectedProdi} onChange={setSelectedProdi} />
        <CheckboxFilter title="Lecturers" options={lecturers} selected={selectedLecturers} onChange={setSelectedLecturers} />
        <CheckboxFilter title="Terms" options={terms} selected={selectedTerms} onChange={setSelectedTerms} />
        <CheckboxFilter title="Editors" options={editors} selected={selectedEditors} onChange={setSelectedEditors} />
      </div>
    </div>
  );
}