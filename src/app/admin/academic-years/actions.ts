// src/app/admin/academic-years/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type YearActionState = { error: string | null; success: string | null } | null;

/**
 * Changing the active year changes what every scoped page reports, so these actions are
 * Admin-only — matching the guard on user-role changes, the app's other action with
 * organisation-wide reach.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: 'You are not signed in.' as const };

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();

  if (profile?.role !== 'Admin') {
    return { supabase, error: 'Only an Admin can change academic years.' as const };
  }
  return { supabase, error: null };
}

/**
 * The active year is the default scope for the dashboard, analytics and workload, so a
 * change has to reach all of them. Revalidating the root layout is deliberately broad —
 * a stale page showing last year's figures under this year's heading is exactly the
 * failure this feature exists to prevent.
 */
function revalidateScopedPages() {
  revalidatePath('/', 'layout');
}

export async function addAcademicYear(
  _prev: YearActionState,
  formData: FormData,
): Promise<YearActionState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError, success: null };

  const name = (formData.get('name') as string ?? '').trim();
  const code = (formData.get('code') as string ?? '').trim();

  if (!name || !code) return { error: 'Both a name and a term code prefix are required.', success: null };

  // The code is what links terms to years — '126' claims 1261, 1262, 1263. A typo here
  // silently orphans a whole year's terms, so it is validated rather than trusted.
  if (!/^\d{3}$/.test(code)) {
    return { error: 'The term code prefix must be exactly three digits, e.g. 127 for terms 1271–1273.', success: null };
  }

  const { error } = await supabase.from('academic_years').insert({ name, code });
  if (error) {
    return {
      error: error.code === '23505'
        ? `An academic year with that ${error.message.includes('code') ? 'term code' : 'name'} already exists.`
        : `Could not add the year: ${error.message}`,
      success: null,
    };
  }

  revalidateScopedPages();
  return { error: null, success: `${name} added.` };
}

export async function updateAcademicYear(
  _prev: YearActionState,
  formData: FormData,
): Promise<YearActionState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError, success: null };

  const id = formData.get('id') as string;
  const name = (formData.get('name') as string ?? '').trim();
  if (!id || !name) return { error: 'A name is required.', success: null };

  const { error } = await supabase.from('academic_years').update({ name }).eq('id', id);
  if (error) return { error: `Could not rename the year: ${error.message}`, success: null };

  revalidateScopedPages();
  return { error: null, success: 'Renamed.' };
}

/**
 * Deletion is blocked while terms still point at the year — the same referential guard
 * the lecturer admin uses. Without it the FK would either reject the delete with a raw
 * Postgres error or, worse, leave terms year-less and quietly outside every scope.
 */
export async function deleteAcademicYear(
  _prev: YearActionState,
  formData: FormData,
): Promise<YearActionState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError, success: null };

  const id = formData.get('id') as string;
  if (!id) return { error: 'No year specified.', success: null };

  const { data: year } = await supabase
    .from('academic_years').select('name, is_active').eq('id', id).single();

  if (year?.is_active) {
    return { error: 'This is the active year. Make another year active before deleting it.', success: null };
  }

  const { data: terms } = await supabase
    .from('terms').select('name').eq('academic_year_id', id);

  if (terms && terms.length > 0) {
    const names = terms.map(t => t.name).join(', ');
    return {
      error: `${terms.length} term${terms.length === 1 ? '' : 's'} still belong to this year (${names}). Move them to another year first.`,
      success: null,
    };
  }

  const { error } = await supabase.from('academic_years').delete().eq('id', id);
  if (error) return { error: `Could not delete the year: ${error.message}`, success: null };

  revalidateScopedPages();
  return { error: null, success: `${year?.name ?? 'Year'} deleted.` };
}

/**
 * Switch which year the app reports on.
 *
 * Done in two steps because a partial unique index enforces at most one active year, so
 * the incumbent must stand down before the successor can be set. If the second step
 * fails the app is left with NO active year, which degrades to unscoped all-time figures
 * — visibly wrong rather than silently wrong, and fixed by retrying. That is the right
 * way round: the alternative failure mode, two active years, has no defined meaning.
 */
export async function setActiveAcademicYear(
  _prev: YearActionState,
  formData: FormData,
): Promise<YearActionState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError, success: null };

  const id = formData.get('id') as string;
  if (!id) return { error: 'No year specified.', success: null };

  const { data: year } = await supabase
    .from('academic_years').select('name').eq('id', id).single();

  const { error: clearError } = await supabase
    .from('academic_years').update({ is_active: false }).eq('is_active', true);
  if (clearError) {
    return { error: `Could not stand down the current year: ${clearError.message}`, success: null };
  }

  const { error: setError } = await supabase
    .from('academic_years').update({ is_active: true }).eq('id', id);
  if (setError) {
    return {
      error: `Could not activate ${year?.name ?? 'that year'}: ${setError.message}. No year is active right now, so the app is showing all-time figures — try again.`,
      success: null,
    };
  }

  revalidateScopedPages();
  return {
    error: null,
    success: `${year?.name ?? 'Year'} is now the active year. Unfinished work from earlier years stays visible as carry-over.`,
  };
}

// ---------------------------------------------------------------------------
// Terms
//
// Terms are managed here rather than on their own screen, and a term can only be
// created inside a year. In the database the two are still separate tables with a
// nullable FK, but the UI never offers the unassigned path: a term with no year sits
// outside every scope, so its projects vanish from the dashboard with nothing to
// explain why. Making that state unreachable beats warning about it.
// ---------------------------------------------------------------------------

export async function addTerm(
  _prev: YearActionState,
  formData: FormData,
): Promise<YearActionState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError, success: null };

  const name = (formData.get('name') as string ?? '').trim();
  const yearId = formData.get('academic_year_id') as string;

  if (!name) return { error: 'A term name is required.', success: null };
  if (!yearId) return { error: 'A term must belong to an academic year.', success: null };

  const { data: existing } = await supabase
    .from('terms').select('id').eq('name', name).maybeSingle();
  if (existing) return { error: `Term ${name} already exists.`, success: null };

  const { error } = await supabase
    .from('terms').insert({ name, academic_year_id: Number(yearId) });
  if (error) return { error: `Could not add the term: ${error.message}`, success: null };

  revalidateScopedPages();
  return { error: null, success: `Term ${name} added.` };
}

/**
 * Deletion is blocked while projects still reference the term — the same referential
 * guard the lecturer admin uses (AI_README §9). Without it the FK rejects the delete
 * with a raw Postgres error, or worse the projects lose the one field that says which
 * cohort they were for.
 */
export async function deleteTerm(
  _prev: YearActionState,
  formData: FormData,
): Promise<YearActionState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError, success: null };

  const id = formData.get('id') as string;
  if (!id) return { error: 'No term specified.', success: null };

  const { data: term } = await supabase.from('terms').select('name').eq('id', id).single();
  const { count } = await supabase
    .from('projects').select('id', { count: 'exact', head: true }).eq('term_id', id);

  if ((count ?? 0) > 0) {
    return {
      error: `${count} project${count === 1 ? '' : 's'} ${count === 1 ? 'is' : 'are'} in term ${term?.name ?? id}. Move or delete ${count === 1 ? 'it' : 'them'} before deleting the term.`,
      success: null,
    };
  }

  const { error } = await supabase.from('terms').delete().eq('id', id);
  if (error) return { error: `Could not delete the term: ${error.message}`, success: null };

  revalidateScopedPages();
  return { error: null, success: `Term ${term?.name ?? ''} deleted.` };
}

/**
 * Move a term to a different year.
 *
 * Deliberately has no "no year" option: every term must belong to one. Terms that
 * predate this rule can still be null in the database, and the page offers this control
 * to rescue them — but it can only ever move them INTO a year, never back out.
 */
export async function assignTermToYear(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return;

  const termId = formData.get('term_id') as string;
  const yearId = formData.get('academic_year_id') as string;
  if (!termId || !yearId) return;

  await supabase
    .from('terms')
    .update({ academic_year_id: Number(yearId) })
    .eq('id', termId);

  revalidateScopedPages();
}
