// src/components/insight/OutOfYearPill.tsx
'use client';

import { ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OutOfYearTerm = { term: string; direction: 'behind' | 'ahead' };

/**
 * Marks live work whose term sits outside the active academic year.
 *
 * Two directions, deliberately weighted differently:
 *
 *   behind — the term this was for has already passed. A real signal, so it wears the
 *            same amber the app uses for "needs a look".
 *   ahead  — the term has not started yet; someone is recording early. That is good
 *            practice, so it stays grey. Colouring it would train people to ignore the
 *            colour, and the whole point of the amber is that it means something.
 *
 * Names the TERM rather than the year, because "which cohort is this for" is the actual
 * question — a coordinator reading '1252' knows immediately what it refers to.
 */
export function OutOfYearPill({ value, className }: { value: OutOfYearTerm; className?: string }) {
    const behind = value.direction === 'behind';
    const Icon = behind ? RotateCcw : ArrowRight;

    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 align-middle text-[10px] font-medium',
                className,
            )}
            style={
                behind
                    ? { color: '#8a5a00', background: '#faf1e2' }
                    : { color: '#52514e', background: '#f1f0ec' }
            }
            title={
                behind
                    ? `For term ${value.term}, which has already passed — this is running behind its intended term.`
                    : `For term ${value.term}, which has not started yet — recorded ahead of schedule.`
            }
        >
            <Icon className="h-2.5 w-2.5" />
            {value.term}
        </span>
    );
}
