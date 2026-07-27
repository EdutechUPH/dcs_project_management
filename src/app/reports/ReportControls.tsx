// src/app/reports/ReportControls.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Printer } from 'lucide-react';
import { CheckboxFilter } from '@/components/CheckboxFilter';
import { useReportFilterStatus } from '@/components/insight/FilterStatus';
import { memberOptions } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TermOption = { id: number; name: string; yearName: string | null };

export default function ReportControls({
    view,
    terms,
    selectedTermIds,
    members,
    selectedMemberId,
    sheetCount,
}: {
    view: 'team' | 'members';
    terms: TermOption[];
    selectedTermIds: number[];
    members: { id: string; full_name: string | null; role: string | null }[];
    selectedMemberId: string | null;
    sheetCount: number;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const push = (mutate: (params: URLSearchParams) => void) => {
        const params = new URLSearchParams(searchParams.toString());
        mutate(params);
        startTransition(() => router.push(`/reports?${params.toString()}`));
    };

    // Draft state for the terms, committed when the panel closes. Rebuilding a dozen sheets
    // on every tick of a checkbox meant choosing three terms cost three full re-renders,
    // each one throwing away the last. The same contract as the dashboard and analytics.
    const [draftTerms, setDraftTerms] = useState(selectedTermIds.map(String));
    const applied = useMemo(() => selectedTermIds.map(String).join(','), [selectedTermIds]);
    const [panelOpen, setPanelOpen] = useState(false);

    // Re-sync the draft when the applied value changes from outside — browser Back restores
    // an older query while leaving this component mounted, and without this the draft would
    // stay on the abandoned selection and the page would read as permanently dirty. Adjusting
    // state during render rather than in an effect, so there is no flash of the wrong value.
    const [lastApplied, setLastApplied] = useState(applied);
    if (applied !== lastApplied && !panelOpen) {
        setLastApplied(applied);
        setDraftTerms(selectedTermIds.map(String));
    }

    const isDirty = draftTerms.join(',') !== applied;

    const handleTermsOpenChange = (open: boolean) => {
        setPanelOpen(open);
        // Always written, empty included — a missing param means "not chosen, use the active
        // year", an empty one means "cleared". The same rule as the dashboard.
        if (!open && isDirty) push(p => p.set('terms', draftTerms.join(',')));
    };

    useReportFilterStatus({ isPending, isDirty, willApplyOnClose: panelOpen });

    return (
        <div className="relative mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 print:hidden">
            {/* Two documents, not two filters — a segmented control rather than another
                dropdown, because which report you are looking at is the first thing to know
                and should never be one entry in a list of options. */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <ViewTab
                    active={view === 'team'}
                    // Clearing `member` too: leaving it set would bounce straight back to the
                    // members view, since choosing a person implies that view.
                    onClick={() => push(p => { p.set('view', 'team'); p.delete('member'); })}
                >
                    Team report
                </ViewTab>
                <ViewTab
                    active={view === 'members'}
                    onClick={() => push(p => p.set('view', 'members'))}
                >
                    Individual sheets
                </ViewTab>
            </div>

            <span aria-hidden className="hidden h-5 w-px bg-gray-200 sm:block" />

            <CheckboxFilter
                title="Terms"
                options={terms.map(t => ({
                    value: String(t.id),
                    label: t.name,
                    group: t.yearName ?? undefined,
                }))}
                selected={draftTerms}
                onChange={setDraftTerms}
                onOpenChange={handleTermsOpenChange}
            />

            {/* The same grouped, colour-banded picker as every other member dropdown in the
                app, in single-select mode: an individual sheet is one person's or everyone's,
                so tick boxes would offer a choice the report has no shape for. Cleared means
                everyone with work. */}
            <CheckboxFilter
                title="Member"
                mode="single"
                emptyLabel="Everyone"
                options={memberOptions(members)}
                selected={selectedMemberId ? [selectedMemberId] : []}
                // No draft state: a one-of picker commits and closes in the same click, so
                // there is never an uncommitted selection to hold on to. Choosing a person
                // also carries you into the members view — the alternative is a selection
                // that visibly does nothing until you find the tab that makes it matter.
                onChange={values => push(p => {
                    p.set('view', 'members');
                    if (values[0]) p.set('member', values[0]);
                    else p.delete('member');
                })}
            />

            <span className="text-sm text-gray-500">
                {sheetCount} {sheetCount === 1 ? 'sheet' : 'sheets'}
            </span>

            <Button
                type="button"
                onClick={() => window.print()}
                disabled={sheetCount === 0 || isPending || isDirty}
                className="ml-auto"
                // The one thing about printing that isn't self-evident, kept as a hover
                // rather than a paragraph: browsers stamp their own URL and date on every
                // sheet unless this is switched off.
                title="Choose “Save as PDF”, and turn off “Headers and footers” in the dialog"
            >
                <Printer className="mr-1.5 h-4 w-4" />
                Print / Save as PDF
            </Button>

            {/* Refetch keeps the frame: a hairline progress rail rather than a spinner that
                shifts the layout each time it appears. */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-b-xl">
                {isPending && <div className="h-full w-full animate-pulse bg-blue-500" />}
            </div>
        </div>
    );
}

function ViewTab({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900',
            )}
        >
            {children}
        </button>
    );
}
