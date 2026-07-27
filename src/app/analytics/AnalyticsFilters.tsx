// src/app/analytics/AnalyticsFilters.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, startOfYear, subDays } from 'date-fns';
import { CheckboxFilter } from '@/components/CheckboxFilter';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Check, Download, Filter, RotateCcw, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useReportFilterStatus } from './FilterStatus';

type Option = { value: string; label: string; group?: string; groupOrder?: number; groupClass?: string };

type FilterControlsProps = {
  faculties: Option[];
  prodi: Option[];
  lecturers: Option[];
  terms: Option[];
  editors: Option[];
  /**
   * Terms of the active academic year, applied when the URL carries no `terms` at all.
   *
   * The distinction that makes this work: a MISSING `terms` param means "nobody has
   * chosen yet, so show the active year", while a PRESENT-but-empty one means "the user
   * cleared it, so show every year". Because the draft is seeded from this default,
   * every subsequent navigation writes `terms` explicitly and the two states never blur
   * — otherwise changing an unrelated filter would silently snap the scope back.
   */
  defaultTermIds: string[];
  /** Name of the active year, for saying which default is in force. */
  activeYearName: string | null;
  /** Videos matching the filters currently applied. */
  filteredCount: number;
  /** Videos in the database, ignoring all filters — the "of N" half of the scope note. */
  totalCount: number;
};

/** The five dimension filters, in the order they appear. */
type DimensionKey = 'faculties' | 'prodi' | 'lecturers' | 'terms' | 'editors';

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  faculties: 'Faculty',
  prodi: 'Program',
  lecturers: 'Lecturer',
  terms: 'Term',
  editors: 'Editor',
};

type DatePreset = { label: string; range: () => DateRange };

// Presets before the calendar grid: nobody wants to click twice through a month view
// to say "last 30 days". The date filter scopes on the project's request date.
const DATE_PRESETS: DatePreset[] = [
  { label: 'Last 7 days', range: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: 'Last 30 days', range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: 'Last 90 days', range: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
  { label: 'This year', range: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

const fmt = (date: Date) => format(date, 'yyyy-MM-dd');

export default function AnalyticsFilters({
  faculties,
  prodi,
  lecturers,
  terms,
  editors,
  defaultTermIds,
  activeYearName,
  filteredCount,
  totalCount,
}: FilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [dateOpen, setDateOpen] = useState(false);

  const optionsFor: Record<DimensionKey, Option[]> = useMemo(
    () => ({ faculties, prodi, lecturers, terms, editors }),
    [faculties, prodi, lecturers, terms, editors]
  );

  // ---------------------------------------------------------------------
  // Draft state. The URL is the applied truth; this is what the user is
  // composing. The two are compared below to decide whether Apply has work to do.
  // ---------------------------------------------------------------------
  const [date, setDate] = useState<DateRange | undefined>({
    from: searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined,
    to: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
  });
  const [selected, setSelected] = useState<Record<DimensionKey, string[]>>({
    faculties: searchParams.get('faculties')?.split(',').filter(Boolean) || [],
    prodi: searchParams.get('prodi')?.split(',').filter(Boolean) || [],
    lecturers: searchParams.get('lecturers')?.split(',').filter(Boolean) || [],
    // null (absent) falls back to the active year; '' (present, empty) is a deliberate
    // "all years" and must survive. `?? ` rather than `||` for exactly that reason.
    terms: (searchParams.get('terms') ?? defaultTermIds.join(','))
      .split(',').filter(Boolean),
    editors: searchParams.get('editors')?.split(',').filter(Boolean) || [],
  });
  const [groupBy, setGroupBy] = useState(searchParams.get('groupBy') || 'faculty');

  const setDimension = (key: DimensionKey, values: string[]) =>
    setSelected(prev => ({ ...prev, [key]: values }));

  // ---------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------
  const buildParams = (draft: { date?: DateRange; selected: Record<DimensionKey, string[]>; groupBy: string }) => {
    const params = new URLSearchParams();
    params.set('groupBy', draft.groupBy);
    if (draft.date?.from) params.set('from', fmt(draft.date.from));
    if (draft.date?.to) params.set('to', fmt(draft.date.to));
    (Object.keys(DIMENSION_LABELS) as DimensionKey[]).forEach(key => {
      const values = draft.selected[key];
      if (values.length > 0) params.set(key, values.join(','));
      // `terms` is always written, empty included, so that clearing it reads as "all
      // years" rather than reverting to the active-year default on the next navigation.
      else if (key === 'terms') params.set('terms', '');
    });
    return params;
  };

  const currentParams = buildParams({ date, selected, groupBy });

  // Anything the user has changed but not yet applied. Compared against the URL so a
  // browser Back that restores an older query correctly reads as "no pending changes".
  const applied = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.get('groupBy')) params.set('groupBy', 'faculty');
    // The server applies the active-year default to a missing `terms`, so spell it out
    // here too — otherwise a first visit looks dirty and prompts an Apply that would
    // change nothing.
    if (!params.has('terms')) params.set('terms', defaultTermIds.join(','));
    params.sort();
    return params.toString();
  }, [searchParams, defaultTermIds]);

  const draftString = useMemo(() => {
    const params = new URLSearchParams(currentParams.toString());
    params.sort();
    return params.toString();
  }, [currentParams]);

  const isDirty = applied !== draftString;

  // While a filter panel is open, closing it will apply the change on its own. Knowing that
  // lets us suppress the "apply" prompt, which would otherwise imply a step that isn't one.
  // A counter rather than a boolean because moving from one dropdown to the next closes and
  // opens in the same beat, and the two events can arrive in either order.
  const [openPanels, setOpenPanels] = useState(0);
  const willApplyOnClose = openPanels > 0;

  const handlePanelOpenChange = (open: boolean) => {
    setOpenPanels(count => Math.max(0, count + (open ? 1 : -1)));
    if (!open) commitOnClose();
  };

  // Publish to the charts below, which veil themselves while they are out of date.
  useReportFilterStatus({ isPending, isDirty, willApplyOnClose });

  const push = (params: URLSearchParams) => {
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  /** Commit the draft as it stands. */
  const apply = () => push(currentParams);

  /**
   * Commit when a dimension dropdown closes. Every other control here already applies on
   * its own, so leaving these five behind a separate button meant a filter could look
   * selected while the charts still showed unfiltered data — the one thing this toolbar
   * must never do. Committing on close (not per tick) keeps it to one query per visit.
   */
  const commitOnClose = () => {
    if (isDirty) apply();
  };

  /** Edit one dimension AND commit immediately — used by the chips, where a click that
   *  visibly removes a filter must actually change the numbers. */
  const applyWith = (patch: Partial<{ date?: DateRange; selected: Record<DimensionKey, string[]>; groupBy: string }>) => {
    const next = {
      date: 'date' in patch ? patch.date : date,
      selected: patch.selected ?? selected,
      groupBy: patch.groupBy ?? groupBy,
    };
    if ('date' in patch) setDate(patch.date);
    if (patch.selected) setSelected(patch.selected);
    if (patch.groupBy) setGroupBy(patch.groupBy);
    push(buildParams(next));
  };

  const clearAll = () => {
    setDate(undefined);
    setSelected({ faculties: [], prodi: [], lecturers: [], terms: [], editors: [] });
    push(buildParams({ date: undefined, selected: { faculties: [], prodi: [], lecturers: [], terms: [], editors: [] }, groupBy }));
  };

  // ---------------------------------------------------------------------
  // Active filter chips — the answer to "why does this number look wrong?"
  // ---------------------------------------------------------------------
  type Chip = { id: string; label: string; onRemove: () => void };

  const chips: Chip[] = [];

  if (date?.from || date?.to) {
    const label =
      date.from && date.to
        ? `${format(date.from, 'd MMM yyyy')} – ${format(date.to, 'd MMM yyyy')}`
        : date.from
          ? `From ${format(date.from, 'd MMM yyyy')}`
          : `Until ${format(date.to!, 'd MMM yyyy')}`;
    chips.push({ id: 'date', label: `Requested ${label}`, onRemove: () => applyWith({ date: undefined }) });
  }

  // When the term selection is exactly the active year, say so in one chip. Three chips
  // reading "Term: 1261", "Term: 1262", "Term: 1263" describe the same scope in a way the
  // reader has to reassemble, and removing one of them silently produces a partial year.
  const termsAreActiveYear =
    activeYearName != null &&
    defaultTermIds.length > 0 &&
    selected.terms.length === defaultTermIds.length &&
    defaultTermIds.every(id => selected.terms.includes(id));

  (Object.keys(DIMENSION_LABELS) as DimensionKey[]).forEach(key => {
    if (key === 'terms' && termsAreActiveYear) {
      chips.push({
        id: 'terms:active-year',
        label: `Academic year: ${activeYearName}`,
        onRemove: () => applyWith({ selected: { ...selected, terms: [] } }),
      });
      return;
    }
    selected[key].forEach(value => {
      const option = optionsFor[key].find(o => o.value === value);
      chips.push({
        id: `${key}:${value}`,
        label: `${DIMENSION_LABELS[key]}: ${option?.label.trim() || value}`,
        onRemove: () =>
          applyWith({ selected: { ...selected, [key]: selected[key].filter(v => v !== value) } }),
      });
    });
  });

  const activePreset = DATE_PRESETS.find(preset => {
    if (!date?.from || !date?.to) return false;
    const range = preset.range();
    return range.from && range.to && fmt(range.from) === fmt(date.from) && fmt(range.to) === fmt(date.to);
  });

  const dateLabel = date?.from
    ? date.to
      ? `${format(date.from, 'd MMM y')} – ${format(date.to, 'd MMM y')}`
      : format(date.from, 'd MMM y')
    : 'All time';

  const exportCsv = () => {
    const params = buildParams({ date, selected, groupBy });
    params.delete('groupBy');
    window.open(`/api/analytics/export?${params.toString()}`, '_blank');
  };

  const hasFilters = chips.length > 0;
  const hiddenCount = Math.max(0, totalCount - filteredCount);

  // Full-bleed toolbar band rather than a floating card: it pins to the top of the
  // scroll area on desktop, and a rounded translucent card would let charts show
  // through its corners as they pass underneath.
  //
  // The whole band changes colour once a filter is on. A tinted, permanently visible
  // bar is what stops someone reading a filtered chart as the full picture — chips
  // alone are too quiet to carry that, especially after scrolling back up to it.
  return (
    <div
      className={cn(
        "relative z-20 -mx-8 border-b px-8 backdrop-blur md:sticky md:top-0",
        hasFilters
          ? "border-blue-200 bg-blue-50/90 supports-[backdrop-filter]:bg-blue-50/75"
          : "border-gray-200 bg-white/95 supports-[backdrop-filter]:bg-white/85"
      )}
    >
      <div>
        {/* Row 1 — date range first, then the dimensions, then the view control */}
        <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Popover
              open={dateOpen}
              onOpenChange={next => {
                setDateOpen(next);
                // Same contract as the dimension dropdowns: picking a range and clicking
                // away applies it. The explicit button below is a shortcut, not the only way.
                handlePanelOpenChange(next);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 justify-start px-3 text-left text-sm font-normal",
                    date?.from ? "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100" : "text-gray-600"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {activePreset ? activePreset.label : dateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="border-b p-1.5">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Project requested
                  </p>
                  {DATE_PRESETS.map(preset => {
                    const isActive = activePreset?.label === preset.label;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setDate(preset.range())}
                        className={cn(
                          "flex w-full items-center justify-between rounded px-2 py-1.5 text-sm transition-colors",
                          isActive ? "font-medium text-blue-800" : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {preset.label}
                        {isActive && <Check className="h-4 w-4" strokeWidth={3} />}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setDate(undefined)}
                    className={cn(
                      "flex w-full items-center justify-between rounded px-2 py-1.5 text-sm transition-colors",
                      !date?.from && !date?.to ? "font-medium text-blue-800" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    All time
                    {!date?.from && !date?.to && <Check className="h-4 w-4" strokeWidth={3} />}
                  </button>
                </div>
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
                <div className="flex items-center justify-between border-t p-2">
                  <span className="pl-1 text-xs text-gray-500">
                    {date?.from ? dateLabel : 'No range selected'}
                  </span>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setDateOpen(false);
                      applyWith({ date });
                    }}
                  >
                    Apply dates
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <span aria-hidden className="hidden h-5 w-px bg-gray-200 lg:block" />

            <CheckboxFilter title="Faculties" options={faculties} selected={selected.faculties} onChange={v => setDimension('faculties', v)} onOpenChange={handlePanelOpenChange} />
            <CheckboxFilter title="Programs" options={prodi} selected={selected.prodi} onChange={v => setDimension('prodi', v)} onOpenChange={handlePanelOpenChange} />
            <CheckboxFilter title="Lecturers" options={lecturers} selected={selected.lecturers} onChange={v => setDimension('lecturers', v)} onOpenChange={handlePanelOpenChange} />
            <CheckboxFilter title="Terms" options={terms} selected={selected.terms} onChange={v => setDimension('terms', v)} onOpenChange={handlePanelOpenChange} />
            <CheckboxFilter title="Editors" options={editors} selected={selected.editors} onChange={v => setDimension('editors', v)} onOpenChange={handlePanelOpenChange} />
          </div>

          <div className="flex items-center gap-2">
            {/* Grouping changes how the breakdown chart is cut, it does not narrow the
                data — so it sits apart from the filters and applies on its own. */}
            <label className="hidden text-xs font-medium text-gray-500 xl:block">Group by</label>
            <Select value={groupBy} onValueChange={value => applyWith({ groupBy: value })}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Group by…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="prodi">Program</SelectItem>
                <SelectItem value="lecturer">Lecturer</SelectItem>
                <SelectItem value="term">Term</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="type">Work type</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-9 text-gray-600"
              onClick={exportCsv}
              title="Download the current selection as CSV"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Row 2 — states plainly that this is a subset, names the subset, and offers the way out */}
        {(hasFilters || isDirty) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-blue-200/70 py-2.5">
            {hasFilters && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 py-1 pl-2 pr-2.5 text-xs font-semibold text-white">
                  <Filter className="h-3 w-3" strokeWidth={2.5} />
                  Filtered view
                </span>

                <span className="text-xs text-blue-900/80">
                  <span className="font-semibold">{filteredCount.toLocaleString()}</span> of{" "}
                  {totalCount.toLocaleString()} videos
                  {hiddenCount > 0 && ` · ${hiddenCount.toLocaleString()} hidden`}
                </span>

                <span aria-hidden className="h-4 w-px bg-blue-200" />
              </>
            )}

            {chips.map(chip => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white py-0.5 pl-2.5 pr-1 text-xs text-blue-900"
              >
                <span className="max-w-[220px] truncate">{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Remove filter ${chip.label}`}
                  className="rounded-full p-0.5 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={isPending}
                className="ml-auto h-7 border-gray-300 bg-white text-xs font-medium text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <RotateCcw className="mr-1.5 h-3 w-3" />
                Clear {chips.length === 1 ? 'filter' : 'all filters'}
              </Button>
            )}

            {/* Deliberately hidden while a panel is open, because closing it applies the change
                anyway and a visible Apply button there would teach people that applying is a
                required step — the very confusion this toolbar was rebuilt to remove. What is
                left is the one state where nothing else will commit for you: browser Back,
                which restores an older query while leaving the controls as the user left them.
                It sits outside the veil so it is always clickable. */}
            {isDirty && !willApplyOnClose && (
              <Button
                size="sm"
                className="h-7 bg-amber-600 text-xs hover:bg-amber-700"
                onClick={apply}
                disabled={isPending}
              >
                {isPending ? 'Applying…' : 'Apply change'}
              </Button>
            )}
          </div>
        )}

        {/* Refetch keeps the frame: a hairline progress rail instead of a layout-shifting spinner */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
          {isPending && <div className="h-full w-full animate-pulse bg-blue-500" />}
        </div>
      </div>
    </div>
  );
}
