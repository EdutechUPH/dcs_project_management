// src/app/admin/academic-years/TermRows.tsx
'use client';

import { useActionState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import SubmitButton from '@/components/SubmitButton';
import { addTerm, deleteTerm, assignTermToYear, type YearActionState } from './actions';

export type TermRow = {
    id: number;
    name: string;
    academic_year_id: number | null;
    projectCount: number;
};

type YearOption = { id: number; name: string };

const initialState: YearActionState = null;

function Message({ state }: { state: YearActionState }) {
    if (!state?.error && !state?.success) return null;
    return (
        <p className={`mt-2 text-xs ${state?.error ? 'text-red-700' : 'text-green-700'}`}>
            {state?.error ?? state?.success}
        </p>
    );
}

/**
 * The terms belonging to one academic year, plus the only way to create a term.
 *
 * There is no standalone "add term" form anywhere in the app: a term is always created
 * inside the year it belongs to, so the year cannot be forgotten. The database still
 * allows a null year — this UI simply never produces one.
 */
export default function TermRows({
    yearId,
    yearName,
    terms,
    allYears,
}: {
    yearId: number;
    yearName: string;
    terms: TermRow[];
    allYears: YearOption[];
}) {
    const [addState, addAction] = useActionState(addTerm, initialState);
    const [deleteState, deleteAction] = useActionState(deleteTerm, initialState);

    return (
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50/60 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-gray-500">
                Terms in {yearName}
            </h4>

            <ul className="mt-2 space-y-1">
                {terms.map(term => (
                    <li
                        key={term.id}
                        className="flex flex-wrap items-center gap-2 rounded bg-white px-3 py-2 text-sm"
                    >
                        <span className="font-medium text-gray-800">{term.name}</span>
                        <span className="text-xs text-gray-500">
                            {term.projectCount} {term.projectCount === 1 ? 'project' : 'projects'}
                        </span>

                        <div className="ml-auto flex items-center gap-1.5">
                            {/* Moving a term re-groups every figure its projects appear in, so it
                                is offered plainly rather than buried — but there is no "none"
                                option: a term always belongs to a year. */}
                            {allYears.length > 1 && (
                                <form action={assignTermToYear}>
                                    <input type="hidden" name="term_id" value={term.id} />
                                    <select
                                        name="academic_year_id"
                                        defaultValue={String(yearId)}
                                        onChange={e => e.currentTarget.form?.requestSubmit()}
                                        aria-label={`Academic year for term ${term.name}`}
                                        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
                                    >
                                        {allYears.map(y => (
                                            <option key={y.id} value={y.id}>{y.name}</option>
                                        ))}
                                    </select>
                                </form>
                            )}

                            <form action={deleteAction}>
                                <input type="hidden" name="id" value={term.id} />
                                <SubmitButton
                                    className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                                    pendingText="…"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </SubmitButton>
                            </form>
                        </div>
                    </li>
                ))}

                {terms.length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-400">
                        No terms yet — add the first one below.
                    </li>
                )}
            </ul>

            <form action={addAction} className="mt-2 flex flex-wrap items-center gap-2">
                <input type="hidden" name="academic_year_id" value={yearId} />
                <input
                    name="name"
                    required
                    placeholder={`e.g. ${terms[0]?.name ?? '1261'}`}
                    className="h-8 w-32 rounded-md border border-gray-300 px-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
                <SubmitButton
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    pendingText="Adding…"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add term
                </SubmitButton>
            </form>

            <Message state={addState} />
            <Message state={deleteState} />
        </div>
    );
}
