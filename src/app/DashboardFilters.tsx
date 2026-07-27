// src/app/DashboardFilters.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { CheckboxFilter } from '@/components/CheckboxFilter';
import { useReportFilterStatus } from '@/components/insight/FilterStatus';
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
        // NOT seeded with the active year's terms. The server does not apply a term filter
        // when the param is absent — the year narrows completed work only (§13) — so a
        // draft that started with three terms selected was claiming a filter the query was
        // not running. Worse, the first unrelated change committed those three terms for
        // real, and ongoing work from other years vanished from a dashboard whose whole
        // point is that it must not be strict.
        term: searchParams.get('term')?.split(',').filter(Boolean) || [],
        teamMember: searchParams.get('teamMember')?.split(',').filter(Boolean) || [],
        lecturer: searchParams.get('lecturer')?.split(',').filter(Boolean) || [],
    });

    /**
     * Whether the reader has expressed any term preference at all.
     *
     * This is the absent-versus-empty distinction the server reads (§13), tracked on the
     * client so an unrelated change cannot collapse it: a MISSING `term` means "nobody has
     * chosen, apply the active year", a PRESENT-but-empty one means "the reader cleared it,
     * show every year". Writing `term=''` unconditionally would turn the first into the
     * second the moment somebody picked a faculty.
     */
    const [termTouched, setTermTouched] = useState(searchParams.has('term'));

    const buildParams = (
        draft: Record<DimensionKey, string[]>,
        query?: string | null,
        touched: boolean = termTouched,
    ) => {
        const params = new URLSearchParams(searchParams.toString());
        (Object.keys(DIMENSION_LABELS) as DimensionKey[]).forEach(key => {
            if (draft[key].length > 0) params.set(key, draft[key].join(','));
            else if (key === 'term') {
                if (touched) params.set('term', '');
                else params.delete('term');
            }
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

    // The applied truth, normalised the same way `buildParams` writes it so the two can be
    // compared as strings. Nothing is spelled out here that the draft does not also spell
    // out: forcing `term=''` in only one of the two made a first visit compare "" against
    // the seeded year and report itself permanently dirty — which, once the toolbar started
    // publishing that flag, veiled the whole dashboard on load with no way to clear it.
    const applied = useMemo(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('page');
        params.sort();
        return params.toString();
    }, [searchParams]);

    const draftString = useMemo(() => {
        const params = buildParams(selected);
        params.sort();
        return params.toString();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, searchParams, termTouched]);

    const isDirty = applied !== draftString;

    /** Commit when a dropdown closes — the same contract as the analytics toolbar, so a
     *  selection can never sit there looking applied while the table shows something else. */
    const commitOnClose = () => {
        if (isDirty) push(buildParams(selected));
    };

    // A counter rather than a boolean because moving from one dropdown straight to the next
    // closes and opens in the same beat, and the two events can arrive in either order.
    const [openPanels, setOpenPanels] = useState(0);
    const willApplyOnClose = openPanels > 0;

    const handlePanelOpenChange = (open: boolean) => {
        setOpenPanels(count => Math.max(0, count + (open ? 1 : -1)));
        if (!open) commitOnClose();
    };

    // Publish to the cards, triage panel and table below, which veil themselves while they
    // are showing something the controls no longer describe.
    useReportFilterStatus({ isPending, isDirty, willApplyOnClose });

    const setDimension = (key: DimensionKey, values: string[]) =>
        setSelected(prev => ({ ...prev, [key]: values }));

    const applyWith = (next: Record<DimensionKey, string[]>, touched?: boolean) => {
        setSelected(next);
        if (touched !== undefined) setTermTouched(touched);
        // `touched` is passed through rather than read back from state: a setState in the
        // same tick has not landed yet, and the params must be built from the new value.
        push(buildParams(next, undefined, touched));
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
        setTermTouched(true);
        // "Clear all filters" includes the academic year, which is listed as a chip beside
        // the others — leaving it applied would make the button visibly not do what it says.
        push(buildParams(empty, '', true));
    };

    // The year is the default whenever the SERVER says it is scoping — `activeYearName` is
    // passed as null otherwise. Comparing term ids by value would be wrong now that the
    // draft is no longer seeded with them: no terms selected is precisely the state in
    // which the year applies.
    const yearIsDefault = activeYearName != null && selected.term.length === 0;

    // ---------------------------------------------------------------------
    // Chips — the answer to "why is this list shorter than I expected?"
    // ---------------------------------------------------------------------
    type Chip = { id: string; label: string; title?: string; onRemove: () => void };
    const chips: Chip[] = [];

    if (yearIsDefault) {
        chips.push({
            id: 'academic-year',
            label: `Academic year: ${activeYearName}`,
            // Says what it actually does. The year narrows COMPLETED work only, so on the
            // Ongoing tab it hides nothing and the count beside it reads "6 of 6" — which
            // looks like a broken filter unless the rule is stated somewhere.
            title:
                'Scopes completed work to this academic year. Ongoing, pending and overdue '
                + 'projects are shown from every year, so nothing live is hidden.',
            // Passing `true` writes term='' explicitly: the reader has now expressed a
            // preference, and without the flag the next unrelated change would drop the
            // param again and silently re-apply the year.
            onRemove: () => applyWith({ ...selected, term: [] }, true),
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
                    onOpenChange={handlePanelOpenChange}
                />
                <CheckboxFilter
                    title="Terms"
                    options={terms}
                    selected={selected.term}
                    // Touching this dropdown at all is a term preference, including ticking
                    // and unticking back to nothing — that means "every year", not "put the
                    // default back".
                    onChange={v => { setDimension('term', v); setTermTouched(true); }}
                    onOpenChange={handlePanelOpenChange}
                />
                <CheckboxFilter
                    title="Lecturers"
                    options={lecturers}
                    selected={selected.lecturer}
                    onChange={v => setDimension('lecturer', v)}
                    onOpenChange={handlePanelOpenChange}
                />
                <CheckboxFilter
                    title="Members"
                    options={teamMembers}
                    selected={selected.teamMember}
                    onChange={v => setDimension('teamMember', v)}
                    onOpenChange={handlePanelOpenChange}
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
                            title={chip.title}
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
