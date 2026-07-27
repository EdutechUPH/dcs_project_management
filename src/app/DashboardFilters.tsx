// src/app/DashboardFilters.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { CheckboxFilter } from '@/components/CheckboxFilter';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Option = { value: string; label: string; group?: string; groupOrder?: number; groupClass?: string };

type DashboardFiltersProps = {
    faculties: Option[];
    terms: Option[];
    teamMembers: Option[];
    lecturers: Option[];
    /**
     * Name of the active academic year, when it is scoping this view. Shown as a chip so
     * the default is visible and removable rather than applied behind the reader.
     */
    activeYearName: string | null;
    /** Term ids the active year owns — what the chip removes when clicked. */
    activeYearTermIds: string[];
    /** Projects matching the filters currently applied. */
    filteredCount: number;
    /** Projects in this status tab ignoring the dimension filters and search. */
    totalCount: number;
};

/** The three dimension filters, in the order they appear. Keys are the URL params. */
type DimensionKey = 'faculty' | 'term' | 'teamMember' | 'lecturer';

const DIMENSION_LABELS: Record<DimensionKey, string> = {
    faculty: 'Faculty',
    term: 'Term',
    lecturer: 'Lecturer',
    teamMember: 'Member',
};

export default function DashboardFilters({
    faculties,
    terms,
    teamMembers,
    lecturers,
    activeYearName,
    activeYearTermIds,
    filteredCount,
    totalCount,
}: DashboardFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const optionsFor: Record<DimensionKey, Option[]> = useMemo(
        () => ({ faculty: faculties, term: terms, teamMember: teamMembers, lecturer: lecturers }),
        [faculties, terms, teamMembers, lecturers]
    );

    // Draft state; the URL stays the applied truth. Values are comma-separated in the URL,
    // so a bookmarked single-value link from before multi-select still parses correctly.
    const [selected, setSelected] = useState<Record<DimensionKey, string[]>>({
        faculty: searchParams.get('faculty')?.split(',').filter(Boolean) || [],
        // Seeded with the active year's terms when the param is absent. Without this the
        // draft would start empty and the first unrelated change — picking a faculty —
        // would write term='' and quietly drop the year scope. `??` not `||`, so a
        // deliberately-cleared empty string survives.
        term: (searchParams.get('term') ?? activeYearTermIds.join(',')).split(',').filter(Boolean),
        teamMember: searchParams.get('teamMember')?.split(',').filter(Boolean) || [],
        lecturer: searchParams.get('lecturer')?.split(',').filter(Boolean) || [],
    });

    const buildParams = (draft: Record<DimensionKey, string[]>, query?: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        (Object.keys(DIMENSION_LABELS) as DimensionKey[]).forEach(key => {
            if (draft[key].length > 0) params.set(key, draft[key].join(','));
            // `term` is always written, empty included. A MISSING term param means "nobody
            // has chosen, so apply the active year"; a PRESENT-but-empty one means "the
            // reader cleared it, show every year". Deleting the key would collapse the two,
            // and clearing the year chip would silently re-apply it on the next navigation.
            else if (key === 'term') params.set('term', '');
            else params.delete(key);
        });

        if (query !== undefined) {
            if (query) params.set('query', query);
            else params.delete('query');
        }

        // Any change to the result set invalidates the page number — staying on page 3 of a
        // result that is now one page long shows an empty table for no visible reason.
        params.delete('page');
        return params;
    };

    const push = (params: URLSearchParams) => {
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const applied = useMemo(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('page');
        // The server applies the active year to a missing `term`, so spell it out here too
        // — otherwise a first visit looks dirty and the toolbar offers to apply nothing.
        if (!params.has('term')) params.set('term', '');
        params.sort();
        return params.toString();
    }, [searchParams]);

    const draftString = useMemo(() => {
        const params = buildParams(selected);
        params.sort();
        return params.toString();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, searchParams]);

    /** Commit when a dropdown closes — the same contract as the analytics toolbar, so a
     *  selection can never sit there looking applied while the table shows something else. */
    const commitOnClose = () => {
        if (applied !== draftString) push(buildParams(selected));
    };

    const setDimension = (key: DimensionKey, values: string[]) =>
        setSelected(prev => ({ ...prev, [key]: values }));

    const applyWith = (next: Record<DimensionKey, string[]>) => {
        setSelected(next);
        push(buildParams(next));
    };

    const handleSearch = useDebouncedCallback((term: string) => {
        push(buildParams(selected, term));
    }, 300);

    const activeQuery = searchParams.get('query') || '';

    const clearAll = () => {
        const empty: Record<DimensionKey, string[]> = {
            faculty: [], term: [], teamMember: [], lecturer: [],
        };
        setSelected(empty);
        push(buildParams(empty, ''));
    };

    // True when the term selection is exactly the active year. Compared by value rather
    // than by "is the param absent", so it still reads as the year after an unrelated
    // filter has written the terms out explicitly.
    const yearIsDefault =
        activeYearName != null &&
        activeYearTermIds.length > 0 &&
        selected.term.length === activeYearTermIds.length &&
        activeYearTermIds.every(id => selected.term.includes(id));

    // ---------------------------------------------------------------------
    // Chips — the answer to "why is this list shorter than I expected?"
    // ---------------------------------------------------------------------
    type Chip = { id: string; label: string; onRemove: () => void };
    const chips: Chip[] = [];

    if (yearIsDefault) {
        chips.push({
            id: 'academic-year',
            label: `Academic year: ${activeYearName}`,
            // Writes term='' explicitly. Completed work from every year comes back;
            // unfinished work was never hidden by the year in the first place.
            onRemove: () => applyWith({ ...selected, term: [] }),
        });
    }

    if (activeQuery) {
        chips.push({
            id: 'query',
            label: `Search: “${activeQuery}”`,
            onRemove: () => push(buildParams(selected, '')),
        });
    }

    (Object.keys(DIMENSION_LABELS) as DimensionKey[]).forEach(key => {
        // The whole year is already one chip above; three more reading "Term: 1251",
        // "Term: 1252", "Term: 1253" describe the same scope in pieces the reader has to
        // reassemble, and removing one leaves a partial year nobody asked for.
        if (key === 'term' && yearIsDefault) return;

        selected[key].forEach(value => {
            const option = optionsFor[key].find(o => o.value === value);
            chips.push({
                id: `${key}:${value}`,
                label: `${DIMENSION_LABELS[key]}: ${option?.label.trim() || value}`,
                onRemove: () => applyWith({ ...selected, [key]: selected[key].filter(v => v !== value) }),
            });
        });
    });

    const hasFilters = chips.length > 0;
    const hiddenCount = Math.max(0, totalCount - filteredCount);

    return (
        <div
            className={cn(
                'relative rounded-xl border px-4 transition-colors',
                hasFilters ? 'border-blue-200 bg-blue-50/70' : 'border-gray-200 bg-white'
            )}
        >
            {/* Row 1 — search and the three dimensions */}
            <div className="flex flex-col gap-2 py-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        placeholder="Search course name…"
                        defaultValue={activeQuery}
                        onChange={e => handleSearch(e.target.value)}
                        className="h-9 w-full rounded-md border border-gray-200 bg-white pl-8 pr-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <span aria-hidden className="hidden h-5 w-px bg-gray-200 sm:block" />

                <CheckboxFilter
                    title="Faculties"
                    options={faculties}
                    selected={selected.faculty}
                    onChange={v => setDimension('faculty', v)}
                    onOpenChange={open => { if (!open) commitOnClose(); }}
                />
                <CheckboxFilter
                    title="Terms"
                    options={terms}
                    selected={selected.term}
                    onChange={v => setDimension('term', v)}
                    onOpenChange={open => { if (!open) commitOnClose(); }}
                />
                <CheckboxFilter
                    title="Lecturers"
                    options={lecturers}
                    selected={selected.lecturer}
                    onChange={v => setDimension('lecturer', v)}
                    onOpenChange={open => { if (!open) commitOnClose(); }}
                />
                <CheckboxFilter
                    title="Members"
                    options={teamMembers}
                    selected={selected.teamMember}
                    onChange={v => setDimension('teamMember', v)}
                    onOpenChange={open => { if (!open) commitOnClose(); }}
                />
            </div>

            {/* Row 2 — states that this is a subset, names it, and offers the way out */}
            {hasFilters && (
                <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-blue-200/70 py-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 py-1 pl-2 pr-2.5 text-xs font-semibold text-white">
                        <Filter className="h-3 w-3" strokeWidth={2.5} />
                        Filtered view
                    </span>

                    <span className="text-xs text-blue-900/80">
                        <span className="font-semibold">{filteredCount.toLocaleString()}</span> of{' '}
                        {totalCount.toLocaleString()} in this tab
                        {hiddenCount > 0 && ` · ${hiddenCount.toLocaleString()} hidden`}
                    </span>

                    <span aria-hidden className="h-4 w-px bg-blue-200" />

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
                </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-b-xl">
                {isPending && <div className="h-full w-full animate-pulse bg-blue-500" />}
            </div>
        </div>
    );
}
