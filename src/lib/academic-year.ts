// src/lib/academic-year.ts
//
// The active academic year and what it scopes.
//
// A year owns a set of terms (2026/2027 owns 1261, 1262, 1263). Exactly one year is
// active at a time, and the active year is the DEFAULT scope for the dashboard,
// analytics and workload — not a hard filter. Two rules follow from that, and both
// matter more than they look:
//
//   1. Work from an earlier year that is still running does NOT disappear when the
//      year is switched. It becomes CARRY-OVER: still counted, still chaseable, and
//      labelled with the term it came from. When this was designed, switching to
//      2026/2027 would otherwise have hidden 60 undelivered videos and the only
//      overdue project on the board.
//   2. An explicit term filter overrides the year. Someone who asks for 1252 gets
//      1252, whatever the active year is.
//
// Carry-over is about which year's plan a project belonged to, not whether it is
// late. A 1251 project due in December 2026 is carry-over and perfectly on time; the
// two states are independent and a project can be either, both, or neither.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface AcademicYear {
  id: number;
  name: string;   // '2025/2026'
  code: string;   // '125' — the term-name prefix this year owns
  is_active: boolean;
}

export interface YearScope {
  /**
   * The active year, or null when `db_schema_academic_years.sql` has not been run yet
   * or no year is flagged active. Null means "scope to nothing" — every consumer falls
   * back to its previous all-time behaviour rather than showing an empty page.
   */
  active: AcademicYear | null;
  years: AcademicYear[];
  /** Term ids owned by the active year. Empty when `active` is null. */
  activeTermIds: number[];
  /** Term ids owned by any year before the active one — the carry-over universe. */
  earlierTermIds: number[];
  /**
   * Term ids owned by any year after the active one.
   *
   * Work here is legitimately in flight: a course for 1262 can be recorded during 1252,
   * and often is. This list exists so that work can be LABELLED, never so it can be
   * hidden — an earlier version of this file had no forward case at all, and a project
   * for a future term simply vanished from the dashboard while people were working on it.
   */
  laterTermIds: number[];
  /** Term id → its year's display name, for labelling a carried-over row. */
  termYearName: Record<number, string>;
  /** Term id → term name ('1252'), so a pill can name the term rather than the year. */
  termName: Record<number, string>;
}

/** The scope every consumer gets when the year layer isn't available. */
export const NO_YEAR_SCOPE: YearScope = {
  active: null,
  years: [],
  activeTermIds: [],
  earlierTermIds: [],
  laterTermIds: [],
  termYearName: {},
  termName: {},
};

/**
 * Read the year layer.
 *
 * Never throws and never returns a partial scope: if the tables are missing — which is
 * the state of any environment where the migration has not been applied — this returns
 * NO_YEAR_SCOPE and the caller behaves exactly as it did before the feature existed.
 * That fallback is deliberate. A dashboard that renders all-time figures is wrong in a
 * recoverable way; one that throws on a missing column is not.
 */
export async function getYearScope(
  supabase: SupabaseClient,
): Promise<YearScope> {
  const [{ data: years, error: yearsError }, { data: terms, error: termsError }] =
    await Promise.all([
      supabase.from('academic_years').select('id, name, code, is_active'),
      supabase.from('terms').select('id, name, academic_year_id'),
    ]);

  if (yearsError || termsError || !years || !terms) {
    // 42P01 (undefined_table) / 42703 (undefined_column) are the expected errors before
    // the migration is applied, and are not worth logging on every request. Anything
    // else is worth knowing about.
    const code = yearsError?.code ?? termsError?.code;
    if (code !== '42P01' && code !== '42703') {
      console.error('Academic year scope unavailable:', yearsError ?? termsError);
    }
    return NO_YEAR_SCOPE;
  }

  const allYears = (years as AcademicYear[]).slice().sort((a, b) => a.code.localeCompare(b.code));
  const active = allYears.find(y => y.is_active) ?? null;

  const yearById = new Map(allYears.map(y => [y.id, y]));
  const termRows = terms as { id: number; name: string; academic_year_id: number | null }[];

  const activeTermIds: number[] = [];
  const earlierTermIds: number[] = [];
  const laterTermIds: number[] = [];
  const termYearName: Record<number, string> = {};
  const termName: Record<number, string> = {};

  for (const term of termRows) {
    termName[term.id] = term.name;
    const year = term.academic_year_id != null ? yearById.get(term.academic_year_id) : undefined;
    if (!year) continue;
    termYearName[term.id] = year.name;

    if (!active) continue;
    if (year.id === active.id) activeTermIds.push(term.id);
    // String compare is safe and intentional: codes are fixed-width numeric strings
    // ('125' < '126'), so lexical order is chronological order without parsing.
    else if (year.code < active.code) earlierTermIds.push(term.id);
    else laterTermIds.push(term.id);
  }

  return {
    active, years: allYears,
    activeTermIds, earlierTermIds, laterTermIds,
    termYearName, termName,
  };
}

// ---------------------------------------------------------------------------
// Classifying a project against the scope
// ---------------------------------------------------------------------------

type HasTerm = { term_id: number | string | null };

const termIdOf = (project: HasTerm): number | null => {
  if (project.term_id == null) return null;
  const id = Number(project.term_id);
  return Number.isNaN(id) ? null : id;
};

/** True when the project belongs to a term in the active year. */
export function inActiveYear(project: HasTerm, scope: YearScope): boolean {
  const id = termIdOf(project);
  return id != null && scope.activeTermIds.includes(id);
}

/**
 * True when the project belongs to an earlier year.
 *
 * Says nothing about whether the project is still running — callers pair this with
 * their own "is this live" test, because a *completed* project from last year is
 * history, not carry-over.
 */
export function fromEarlierYear(project: HasTerm, scope: YearScope): boolean {
  const id = termIdOf(project);
  return id != null && scope.earlierTermIds.includes(id);
}

/** True when the project's term belongs to a year after the active one. */
export function fromLaterYear(project: HasTerm, scope: YearScope): boolean {
  const id = termIdOf(project);
  return id != null && scope.laterTermIds.includes(id);
}

/**
 * Where a project sits relative to the active year.
 *
 * `behind` — its term has already passed. Late against the term it was meant for.
 * `ahead`  — its term has not started. Recorded early, which is normal and healthy.
 * `current`/`unscoped` — nothing to say.
 *
 * The asymmetry matters: `behind` is a risk worth colouring, `ahead` is good practice
 * and must not be dressed up as a warning. Both exist only to LABEL work — neither is
 * ever a reason to hide it from an operational view.
 */
export type YearRelation = 'current' | 'behind' | 'ahead' | 'unscoped';

export function yearRelation(project: HasTerm, scope: YearScope): YearRelation {
  if (scope.active == null) return 'unscoped';
  if (inActiveYear(project, scope)) return 'current';
  if (fromEarlierYear(project, scope)) return 'behind';
  if (fromLaterYear(project, scope)) return 'ahead';
  return 'unscoped';
}

/**
 * The pill a row should carry, or null when the project sits in the active year and
 * needs no explanation. Shape matches `Project.outOfYearTerm`.
 */
export function outOfYearTerm(
  project: HasTerm,
  scope: YearScope,
): { term: string; direction: 'behind' | 'ahead' } | null {
  const relation = yearRelation(project, scope);
  if (relation !== 'behind' && relation !== 'ahead') return null;
  const term = termLabel(project, scope);
  return term ? { term, direction: relation } : null;
}

/** The term name to show on a pill, e.g. '1252'. */
export function termLabel(project: HasTerm, scope: YearScope): string | null {
  const id = termIdOf(project);
  return id != null ? scope.termName[id] ?? null : null;
}

/** The year name a project's term belongs to, e.g. '2025/2026'. */
export function yearLabel(project: HasTerm, scope: YearScope): string | null {
  const id = termIdOf(project);
  return id != null ? scope.termYearName[id] ?? null : null;
}

/**
 * Whether year scoping should apply at all.
 *
 * An explicit term filter wins — that is the override that keeps the year a default
 * rather than a cage. With no active year there is nothing to scope to.
 */
export function shouldScopeToYear(scope: YearScope, explicitTermIds: string[] | null): boolean {
  return scope.active != null && !explicitTermIds;
}
