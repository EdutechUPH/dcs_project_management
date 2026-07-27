// src/lib/dates.ts
//
// One implementation of every date rule the app depends on. These were previously
// re-derived per file — the projects table had its own `formatDate`/`daysBetween`,
// the dashboard and workload pages each did raw `new Date()` arithmetic inline, and
// the deadline rule from AI_README §11 lived only inside the analytics queries.
//
// The important one is `deadlineFor`. The on-time table, the deadline-risk buckets
// and every "days remaining" badge must resolve a deadline the same way, or two
// cards describing the same video disagree. Import it; never re-inline the
// `?? projects.due_date` fallback.

const MS_PER_DAY = 86_400_000;

/**
 * Parse a value out of Postgres.
 *
 * A DATE column comes back as `YYYY-MM-DD`, which `new Date()` reads as UTC
 * midnight — in any timezone behind UTC that is the *previous* day locally, so a
 * deadline silently shifts a day early. Appending the time forces local midnight.
 * A TIMESTAMPTZ already carries its own offset and is parsed as-is.
 */
export function parseDbDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = value.includes('T') || value.includes(':')
    ? new Date(value)
    : new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 2026-03-12 → "12 Mar 2026". Returns an em dash for anything unparseable. */
export function formatDate(value: string | Date | null | undefined): string {
  const date = value instanceof Date ? value : parseDbDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** 2026-03-12 → "12 Mar". For dense rows where the year is implied by context. */
export function formatDateShort(value: string | Date | null | undefined): string {
  const date = value instanceof Date ? value : parseDbDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/** Days from today until `value`. Negative means it has passed. Null if undated. */
export function daysUntil(value: string | Date | null | undefined): number | null {
  const date = value instanceof Date ? value : parseDbDate(value);
  if (!date) return null;
  return daysBetween(startOfToday(), startOfDay(date));
}

/** Days elapsed since `value`, floored at 0. Null if undated. */
export function daysSince(value: string | Date | null | undefined): number | null {
  const date = value instanceof Date ? value : parseDbDate(value);
  if (!date) return null;
  return Math.max(0, daysBetween(date, new Date()));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfToday(): Date {
  return startOfDay(new Date());
}

// ---------------------------------------------------------------------------
// The deadline rule (AI_README §11)
// ---------------------------------------------------------------------------

type HasDueDate = { due_date?: string | null };

/**
 * The deadline that actually applies to a video.
 *
 * A NULL `videos.due_date` means "inherit the project's" — it does not mean the
 * video is undated. Both being null is the genuinely undated case, which callers
 * must report as *Not Tracked* rather than assuming punctuality.
 */
export function deadlineFor(
  video: HasDueDate | null | undefined,
  project: HasDueDate | null | undefined,
): string | null {
  return video?.due_date ?? project?.due_date ?? null;
}

/** True when the video carries its own deadline rather than the project's. */
export function hasOwnDeadline(video: HasDueDate | null | undefined): boolean {
  return Boolean(video?.due_date);
}

export type DeadlineTone = 'neutral' | 'good' | 'warning' | 'critical';

/**
 * Severity for a "days remaining" figure, matching the Deadline Risk buckets in
 * `/analytics` so the same video never reads as urgent on one page and calm on
 * another. Undated returns 'neutral' — unknown is not the same as safe, and the
 * label beside it must say so (STATUS colour never travels alone, AI_README §12).
 */
export function deadlineTone(daysRemaining: number | null): DeadlineTone {
  if (daysRemaining == null) return 'neutral';
  if (daysRemaining < 0) return 'critical';
  if (daysRemaining <= 7) return 'warning';
  return 'good';
}

/** "3 days late" / "due today" / "in 5 days" / "no deadline". */
export function deadlineLabel(daysRemaining: number | null): string {
  if (daysRemaining == null) return 'No deadline';
  if (daysRemaining < 0) {
    const late = Math.abs(daysRemaining);
    return `${late} ${late === 1 ? 'day' : 'days'} late`;
  }
  if (daysRemaining === 0) return 'Due today';
  if (daysRemaining === 1) return 'Due tomorrow';
  return `In ${daysRemaining} days`;
}

// ---------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------

/** Videos store minutes and seconds separately; this is their total in minutes. */
export function runtimeMinutes(
  video: { duration_minutes?: number | null; duration_seconds?: number | null } | null | undefined,
): number {
  if (!video) return 0;
  return (video.duration_minutes ?? 0) + (video.duration_seconds ?? 0) / 60;
}
