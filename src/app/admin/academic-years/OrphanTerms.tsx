// src/app/admin/academic-years/OrphanTerms.tsx
'use client';

import { TriangleAlert } from 'lucide-react';
import { assignTermToYear } from './actions';

export type OrphanTerm = { id: number; name: string; projectCount: number };
type YearOption = { id: number; name: string };

/**
 * Rescue hatch for terms that belong to no year.
 *
 * The UI can no longer create one — a term is only addable inside a year — so this
 * exists for rows that predate that rule or were made directly in the database. It
 * renders nothing when there are none, which should be the normal case.
 *
 * Worth surfacing loudly while it lasts: a term with no year is outside every scope, so
 * its projects are missing from the dashboard, analytics and workload with nothing on
 * those pages to hint at why.
 */
export default function OrphanTerms({
    terms,
    years,
}: {
    terms: OrphanTerm[];
    years: YearOption[];
}) {
    if (terms.length === 0) return null;

    const hiddenProjects = terms.reduce((sum, t) => sum + t.projectCount, 0);

    return (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-amber-900">
                <TriangleAlert className="h-4 w-4" />
                {terms.length} term{terms.length === 1 ? '' : 's'} without an academic year
            </h3>
            <p className="mt-1 text-sm text-amber-900">
                {hiddenProjects > 0
                    ? `${hiddenProjects} project${hiddenProjects === 1 ? ' is' : 's are'} in ${terms.length === 1 ? 'it' : 'them'}, and ${hiddenProjects === 1 ? 'it is' : 'they are'} missing from the dashboard, analytics and workload until the term is assigned.`
                    : 'No projects are affected yet, but any added to these terms would be missing from the dashboard, analytics and workload.'}
            </p>

            <ul className="mt-3 space-y-1">
                {terms.map(term => (
                    <li
                        key={term.id}
                        className="flex flex-wrap items-center gap-2 rounded bg-white px-3 py-2 text-sm"
                    >
                        <span className="font-medium text-gray-800">{term.name}</span>
                        <span className="text-xs text-gray-500">
                            {term.projectCount} {term.projectCount === 1 ? 'project' : 'projects'}
                        </span>
                        <form action={assignTermToYear} className="ml-auto">
                            <input type="hidden" name="term_id" value={term.id} />
                            <select
                                name="academic_year_id"
                                defaultValue=""
                                onChange={e => e.currentTarget.form?.requestSubmit()}
                                aria-label={`Academic year for term ${term.name}`}
                                className="rounded border border-amber-300 bg-white px-2 py-1 text-xs text-gray-700"
                            >
                                <option value="" disabled>Choose a year…</option>
                                {years.map(y => (
                                    <option key={y.id} value={y.id}>{y.name}</option>
                                ))}
                            </select>
                        </form>
                    </li>
                ))}
            </ul>
        </section>
    );
}
