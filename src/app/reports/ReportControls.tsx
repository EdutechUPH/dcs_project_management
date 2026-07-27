// src/app/reports/ReportControls.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Printer } from 'lucide-react';
import { CheckboxFilter } from '@/components/CheckboxFilter';
import { memberOptions } from '@/lib/roles';
import { Button } from '@/components/ui/button';

type TermOption = { id: number; name: string; yearName: string | null };

export default function ReportControls({
    terms,
    selectedTermIds,
    members,
    selectedMemberId,
    sheetCount,
}: {
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

    return (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <CheckboxFilter
                title="Terms"
                options={terms.map(t => ({
                    value: String(t.id),
                    label: t.name,
                    group: t.yearName ?? undefined,
                }))}
                selected={selectedTermIds.map(String)}
                // Always written, empty included — a missing param means "not chosen, use the
                // active year", an empty one means "cleared". The same rule as the dashboard.
                onChange={values => push(p => p.set('terms', values.join(',')))}
            />

            {/* The same grouped, colour-banded picker as every other member dropdown in the
                app, in single-select mode: a report is either one person's or the whole
                team's, so tick boxes would offer a choice the report has no shape for.
                Cleared means everyone with work. */}
            <CheckboxFilter
                title="Member"
                mode="single"
                emptyLabel="Everyone"
                options={memberOptions(members)}
                selected={selectedMemberId ? [selectedMemberId] : []}
                onChange={values => push(p => {
                    if (values[0]) p.set('member', values[0]);
                    else p.delete('member');
                })}
            />

            <span className="text-sm text-gray-500">
                {sheetCount} {sheetCount === 1 ? 'sheet' : 'sheets'}
                {isPending && ' · updating…'}
            </span>

            <Button
                type="button"
                onClick={() => window.print()}
                disabled={sheetCount === 0}
                className="ml-auto"
            >
                <Printer className="mr-1.5 h-4 w-4" />
                Print / Save as PDF
            </Button>
        </div>
    );
}
