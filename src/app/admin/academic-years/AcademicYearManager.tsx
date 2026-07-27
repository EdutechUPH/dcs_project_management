// src/app/admin/academic-years/AcademicYearManager.tsx
'use client';

import { useActionState, useRef, useState } from 'react';
import { CheckCircle2, Star, Trash2, TriangleAlert } from 'lucide-react';
import SubmitButton from '@/components/SubmitButton';
import ConfirmationModal from '@/components/ConfirmationModal';
import TermRows, { type TermRow } from './TermRows';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    addAcademicYear,
    deleteAcademicYear,
    setActiveAcademicYear,
    type YearActionState,
} from './actions';

export type YearRow = {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    terms: TermRow[];
    projectCount: number;
    /** Projects in this year still running — what would be left behind if it closed. */
    liveProjectCount: number;
    liveVideoCount: number;
    /**
     * Where this year sits relative to the active one. Unfinished work means something
     * different in each case, and only one of the three is a problem:
     *   active  — ordinary work in progress
     *   later   — started ahead of its terms, which is good practice
     *   earlier — its terms have passed and it is still going: the one amber case
     */
    relation: 'active' | 'earlier' | 'later';
};

const initialState: YearActionState = null;

/**
 * One figure and the noun it counts, as a <dd>/<dt> pair.
 *
 * The number carries the weight and the noun stays quiet, so a row of these can be read
 * as three separate facts at a glance instead of one sentence that has to be parsed.
 */
function Figure({
    value,
    label,
    tone = 'neutral',
}: {
    value: number;
    label: string;
    tone?: 'neutral' | 'warning';
}) {
    return (
        <div className="flex items-baseline gap-1.5">
            <dd className={`font-semibold tabular-nums ${tone === 'warning' ? 'text-amber-700' : 'text-gray-900'}`}>
                {value}
            </dd>
            <dt className={tone === 'warning' ? 'text-amber-700' : 'text-gray-500'}>{label}</dt>
        </div>
    );
}

function Divider() {
    return <span aria-hidden className="text-gray-300">·</span>;
}

function Notice({ state }: { state: YearActionState }) {
    if (!state?.error && !state?.success) return null;
    const bad = Boolean(state?.error);
    return (
        <p
            className={`mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${bad
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-green-200 bg-green-50 text-green-800'
                }`}
        >
            {bad ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{state?.error ?? state?.success}</span>
        </p>
    );
}

export default function AcademicYearManager({ years }: { years: YearRow[] }) {
    const [addState, addAction] = useActionState(addAcademicYear, initialState);
    const [activeState, activateAction] = useActionState(setActiveAcademicYear, initialState);
    const [deleteState, deleteAction] = useActionState(deleteAcademicYear, initialState);

    const active = years.find(y => y.is_active) ?? null;

    // The year awaiting confirmation. Switching is a once-a-year action with app-wide
    // reach, so the consequences are spelled out here rather than left on the page as
    // permanent small print nobody reads on the other 364 days.
    const [pending, setPending] = useState<YearRow | null>(null);
    const activateForm = useRef<HTMLFormElement>(null);

    return (
        <div className="space-y-8">
            {/* No active year is a real state — the migration may not have set one, or a failed
                switch may have left none. Saying so beats letting every page quietly report
                all-time figures under a heading that implies otherwise. */}
            {!active && (
                <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        No academic year is active, so the dashboard, analytics and workload are
                        showing all-time figures. Make a year active below to scope them.
                    </span>
                </p>
            )}

            <section>
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                    Academic years
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    The active year is the default scope for the dashboard, analytics and workload.
                    Switching it does not hide unfinished work from earlier years — that stays
                    visible and labelled as carry-over.
                </p>

                <ul className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
                    {years.map(year => (
                        <li key={year.id} className="px-4 py-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{year.name}</span>
                                        {year.is_active && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                <Star className="h-3 w-3" />
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    {/* Kept to plain facts. The consequences of a switch are explained
                                        at the moment of switching, where they are a decision rather
                                        than background reading. */}
                                    {/* Both figures count PROJECTS — the second is a subset of the
                                        first, so nothing else may sit between them. A term count
                                        used to lead this row and made the line ambiguous: with
                                        three numbers in a row it was not obvious that the last one
                                        counted projects rather than terms. The terms are listed in
                                        full directly below anyway. */}
                                    <dl className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                                        <Figure
                                            value={year.projectCount}
                                            label={year.projectCount === 1 ? 'project' : 'projects'}
                                        />
                                        {year.liveProjectCount > 0 && (
                                            <>
                                                <Divider />
                                                {/* Amber is reserved for the one case that needs
                                                    chasing. Two years can show the same count and
                                                    mean opposite things — "still in production" is a
                                                    healthy active year, "started early" is a head
                                                    start, and only work outliving its own terms is
                                                    a problem. */}
                                                <Figure
                                                    value={year.liveProjectCount}
                                                    label={
                                                        year.relation === 'later' ? 'started early'
                                                            : year.relation === 'earlier' ? 'running past their terms'
                                                                : 'still in production'
                                                    }
                                                    tone={year.relation === 'earlier' ? 'warning' : 'neutral'}
                                                />
                                            </>
                                        )}
                                    </dl>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    {!year.is_active && (
                                        <button
                                            type="button"
                                            onClick={() => setPending(year)}
                                            className="rounded-md border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
                                        >
                                            Make active
                                        </button>
                                    )}

                                    <form
                                        action={deleteAction}
                                        onSubmit={e => {
                                            if (!confirm(`Delete ${year.name}? This cannot be undone.`)) e.preventDefault();
                                        }}
                                    >
                                        <input type="hidden" name="id" value={year.id} />
                                        <SubmitButton
                                            className="rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                                            pendingText="…"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </SubmitButton>
                                    </form>
                                </div>
                            </div>

                            <TermRows
                                yearId={year.id}
                                yearName={year.name}
                                terms={year.terms}
                                allYears={years.map(y => ({ id: y.id, name: y.name }))}
                            />
                        </li>
                    ))}
                    {years.length === 0 && (
                        <li className="px-4 py-8 text-center text-sm text-gray-400">
                            No academic years yet. Add one below.
                        </li>
                    )}
                </ul>

                <Notice state={activeState} />
                <Notice state={deleteState} />
            </section>

            {/* One hidden form the modal submits, rather than a form per row: only one
                switch can be in flight, and this keeps the confirm and the action together. */}
            <form ref={activateForm} action={activateAction} className="hidden">
                <input type="hidden" name="id" value={pending?.id ?? ''} readOnly />
            </form>

            <ConfirmationModal
                isOpen={pending != null}
                onClose={() => setPending(null)}
                onConfirm={() => activateForm.current?.requestSubmit()}
                title={`Make ${pending?.name ?? ''} the active year?`}
                confirmText="Switch active year"
                variant="warning"
                wide
                description={
                    pending && (
                        <>
                            <p>
                                The dashboard, analytics and workload will report on{' '}
                                <strong className="text-gray-900">{pending.name}</strong> by default.
                                Anyone can still look at another year by changing the filters.
                            </p>

                            {/* Direction matters. Moving forward leaves the outgoing year's
                                unfinished work behind its terms, which is the real risk and
                                earns amber. Moving BACK to an earlier year — a correction, or
                                undoing a switch made too soon — leaves nothing behind: that
                                work simply reads as started early instead. */}
                            {active && pending.code > active.code && active.liveProjectCount > 0 ? (
                                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                                    <strong>{active.name} is not finished.</strong>{' '}
                                    {active.liveProjectCount} of its {active.projectCount}{' '}
                                    {active.projectCount === 1 ? 'project' : 'projects'}{' '}
                                    {active.liveProjectCount === 1 ? 'is' : 'are'} still being worked on,
                                    with {active.liveVideoCount}{' '}
                                    {active.liveVideoCount === 1 ? 'video' : 'videos'} not yet delivered.{' '}
                                    {active.liveProjectCount === 1 ? 'It moves' : 'They move'} into the{' '}
                                    <strong>Behind their term</strong> card and{' '}
                                    {active.liveProjectCount === 1 ? 'keeps its' : 'keep their'} deadlines —
                                    nothing is hidden, deleted, or marked complete.
                                </p>
                            ) : active && pending.code > active.code ? (
                                <p className="rounded-md border border-green-200 bg-green-50 p-3 text-green-900">
                                    Everything in {active.name} is finished, so nothing will be left behind.
                                </p>
                            ) : active ? (
                                <p>
                                    This moves the active year <strong>back</strong> to an earlier one.
                                    Work in {active.name} will read as started early rather than behind,
                                    and nothing is left behind by the move.
                                </p>
                            ) : null}

                            {pending.liveProjectCount > 0 && (
                                <p>
                                    {pending.name} already has {pending.liveProjectCount}{' '}
                                    {pending.liveProjectCount === 1 ? 'project' : 'projects'} in progress
                                    and {pending.liveVideoCount}{' '}
                                    {pending.liveVideoCount === 1 ? 'video' : 'videos'} still to deliver,
                                    which will become the dashboard&rsquo;s main focus.
                                </p>
                            )}

                            {/* Completed work leaving the default view is the one genuinely
                                surprising effect, and it applies whichever direction you move. */}
                            {active && active.projectCount - active.liveProjectCount > 0 && (
                                <p>
                                    The {active.projectCount - active.liveProjectCount} completed{' '}
                                    {active.projectCount - active.liveProjectCount === 1 ? 'project' : 'projects'}{' '}
                                    from {active.name} will drop out of the default view, so
                                    &ldquo;Completed this year&rdquo; restarts from{' '}
                                    {pending.projectCount - pending.liveProjectCount}. They are still in
                                    analytics whenever you select {active.name}.
                                </p>
                            )}

                            <p className="text-gray-500">
                                You can switch back at any time; this changes what is shown, never the data.
                            </p>
                        </>
                    )
                }
            />

            <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="font-semibold text-gray-800">Add an academic year</h3>
                <p className="mt-1 text-sm text-gray-500">
                    The term code prefix is what links terms to this year — <code className="rounded bg-gray-100 px-1">127</code>{' '}
                    claims terms 1271, 1272 and 1273.
                </p>
                <form action={addAction} className="mt-4 flex flex-wrap items-end gap-3">
                    <label className="flex-1 min-w-[12rem] text-sm">
                        <span className="mb-1 block font-medium text-gray-700">Name</span>
                        <Input name="name" placeholder="2027/2028" required />
                    </label>
                    <label className="w-32 text-sm">
                        <span className="mb-1 block font-medium text-gray-700">Term prefix</span>
                        <Input name="code" placeholder="127" inputMode="numeric" pattern="\d{3}" required />
                    </label>
                    <Button type="submit">Add year</Button>
                </form>
                <Notice state={addState} />
            </section>
        </div>
    );
}
