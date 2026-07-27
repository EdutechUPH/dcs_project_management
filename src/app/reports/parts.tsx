// src/app/reports/parts.tsx
//
// The shared vocabulary of a printed report: mastheads, figures, rules, bars, swatches.
//
// Extracted once the team report needed the same pieces as the member report. Two copies
// of a bar chart is how one report ends up saying "completed" in blue while the other says
// it in green — and a reader who has both sheets in front of them has no way to know which
// is the mistake.
'use client';

import { SERIES, INK } from '@/components/insight/tokens';
import type { MetricProject } from '@/lib/reports/metrics';

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

/**
 * Completion state owns the first two palette slots across every report.
 *
 * Those two meanings hold for a whole sheet, so categorical colours (faculties) start
 * after them. Sharing a colour across the two legends would make blue mean "completed" in
 * one chart and "Fakultas Ilmu Sosial dan Ilmu Politik" three centimetres below it.
 */
export const DONE_COLOUR = SERIES[0];
export const IN_PRODUCTION_COLOUR = SERIES[1];
/** Pending or cancelled — the bar's own track, so parked work reads as absence. */
export const PARKED_COLOUR = '#e5e7eb';
export const FACULTY_COLOURS = SERIES.slice(2);

/**
 * Assign a colour to every faculty on the sheet, biggest first.
 *
 * Palette slots are used in order and never cycled (tokens.ts): a repeat would put the
 * same swatch against two different faculties in one legend. Past the last slot a faculty
 * falls back to grey — still labelled, just no longer distinctly coloured.
 */
export function buildFacultyColours(projects: MetricProject[]): Map<string, string> {
    const counts = new Map<string, number>();
    for (const project of projects) {
        const name = project.faculties?.name ?? 'Unassigned';
        counts.set(name, (counts.get(name) ?? 0) + (project.videos ?? []).length);
    }

    return new Map(
        [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([name], i) => [name, FACULTY_COLOURS[i] ?? INK.muted]),
    );
}

export type FacultySlice = { name: string; count: number; colour: string };

/** Video counts per faculty, ordered biggest first, wearing the sheet's shared colours. */
export function facultySplit(
    rows: { project: MetricProject; videos: number }[],
    colours: Map<string, string>,
): FacultySlice[] {
    const counts = new Map<string, number>();
    for (const { project, videos } of rows) {
        const name = project.faculties?.name ?? 'Unassigned';
        counts.set(name, (counts.get(name) ?? 0) + videos);
    }

    return [...counts.entries()]
        .map(([name, count]) => ({ name, count, colour: colours.get(name) ?? INK.muted }))
        .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

/**
 * A masthead, not a title bar: three rows between two rules, each row a left and a right
 * item sharing a baseline — what this is, who it is about, and what it covers.
 */
export function Masthead({
    kicker,
    title,
    chip,
    chipClass,
    terms,
    generatedAt,
}: {
    kicker: string;
    title: string;
    chip?: string;
    chipClass?: string;
    terms: string[];
    generatedAt: string;
}) {
    return (
        <header className="report-block">
            <div className="flex items-baseline justify-between gap-6 border-b border-gray-300 pb-2">
                <p className="text-[7.5pt] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    DCS Project Tracker
                </p>
                <p className="text-[7.5pt] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    {kicker}
                </p>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-6">
                <h1 className="text-[22pt] font-bold leading-none tracking-tight">{title}</h1>
                {chip && (
                    <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[7pt] font-semibold uppercase tracking-[0.08em] ${chipClass ?? 'border-gray-200 bg-gray-50 text-gray-700'}`}
                    >
                        {chip}
                    </span>
                )}
            </div>

            <div className="mt-2.5 flex items-baseline justify-between gap-6 border-b-2 border-gray-900 pb-2.5 text-[8.5pt] text-gray-500">
                <p>
                    {terms.length === 1 ? 'Term' : 'Terms'} {terms.join(' · ')}
                </p>
                {/* The date belongs in the masthead where a reader looks for it, rather than
                    in small print at the foot of the last page. */}
                <p>Generated {generatedAt}</p>
            </div>
        </header>
    );
}

/** Divides a sheet into its major parts. */
export function SectionRule({ children }: { children: React.ReactNode }) {
    return (
        <div className="report-keep-with-next flex items-center gap-3 pt-1">
            <h2 className="text-[8pt] font-bold uppercase tracking-[0.14em] text-gray-900">
                {children}
            </h2>
            <span className="h-px flex-1 bg-gray-300" />
        </div>
    );
}

export function SectionTitle({
    children,
    keepWithNext = false,
}: {
    children: React.ReactNode;
    keepWithNext?: boolean;
}) {
    return (
        <h3
            className={`text-[7.5pt] font-bold uppercase tracking-[0.1em] text-gray-400 ${keepWithNext ? 'report-keep-with-next' : ''}`}
        >
            {children}
        </h3>
    );
}

export function Figure({
    value,
    label,
    lead = false,
}: {
    value: string;
    label: string;
    lead?: boolean;
}) {
    return (
        <div className={`rounded border px-2.5 py-3 ${lead ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
            <p className={`font-bold leading-none tracking-tight ${lead ? 'text-[17pt]' : 'text-[14pt]'}`}>
                {value}
            </p>
            <p className="mt-1.5 text-[7.5pt] leading-snug text-gray-500">{label}</p>
        </div>
    );
}

export function Swatch({ color }: { color: string }) {
    return (
        <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 rounded-[1px]"
            style={{ background: color }}
        />
    );
}

export function Footer({ children }: { children: React.ReactNode }) {
    return (
        <footer className="report-block mt-auto pt-7 text-[7pt] text-gray-400 print:mt-8">
            <span className="block border-t border-gray-200 pt-2">{children}</span>
        </footer>
    );
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

/**
 * One bar per project, scaled to the largest. Completed and in-production are drawn;
 * anything left is a video in a Pending or Cancelled project, which shows as the bar's own
 * grey track — so the coloured lengths add up to the headline figures instead of quietly
 * absorbing parked work.
 */
export function ProjectBars({
    rows,
}: {
    rows: { project: MetricProject; completed: number; inProduction: number; total: number }[];
}) {
    const max = Math.max(...rows.map(r => r.total), 1);
    const anyParked = rows.some(r => r.total - r.completed - r.inProduction > 0);

    return (
        <ul className="mt-3 space-y-2.5">
            {rows.map(({ project, completed, inProduction, total }) => (
                <li key={project.id} className="report-row grid grid-cols-[1fr_auto] items-center gap-x-4">
                    <div className="min-w-0">
                        <p className="truncate text-[9.5pt] leading-snug" title={project.course_name ?? ''}>
                            {project.course_name}
                        </p>
                        <p className="truncate text-[7.5pt] leading-snug text-gray-500">
                            {project.faculties?.name ?? '—'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-3 w-[46mm] overflow-hidden rounded-sm" style={{ background: PARKED_COLOUR }}>
                            <div style={{ width: `${(completed / max) * 100}%`, background: DONE_COLOUR }} />
                            <div style={{ width: `${(inProduction / max) * 100}%`, background: IN_PRODUCTION_COLOUR }} />
                            <div style={{ width: `${((max - total) / max) * 100}%`, background: '#fff' }} />
                        </div>
                        <span className="w-10 text-right text-[8.5pt] font-semibold tabular-nums">
                            {completed}/{total}
                        </span>
                    </div>
                </li>
            ))}
            <li className="report-row flex items-center gap-3 pt-1 text-[7.5pt] text-gray-500">
                <Swatch color={DONE_COLOUR} /> completed
                <Swatch color={IN_PRODUCTION_COLOUR} /> in production
                {anyParked && (
                    <>
                        <Swatch color={PARKED_COLOUR} /> pending or cancelled
                    </>
                )}
            </li>
        </ul>
    );
}

/** A single stacked bar: which faculties the work went to, by video count. */
export function FacultySplit({ split }: { split: FacultySlice[] }) {
    const total = split.reduce((s, f) => s + f.count, 0);
    if (total === 0) return null;

    return (
        <div className="mt-3">
            <div className="flex h-3.5 overflow-hidden rounded-sm">
                {split.map(f => (
                    <div
                        key={f.name}
                        style={{ width: `${(f.count / total) * 100}%`, background: f.colour }}
                        title={`${f.name}: ${f.count}`}
                    />
                ))}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[8pt] text-gray-600">
                {split.map(f => (
                    <li key={f.name} className="flex items-center gap-1.5">
                        <Swatch color={f.colour} />
                        {f.name}
                        <span className="font-semibold tabular-nums">{f.count}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** A labelled proportion bar. */
export function ShareRow({
    label,
    value,
    colour = DONE_COLOUR,
    labelWidth = 'w-14',
}: {
    label: string;
    value: number;
    colour?: string;
    labelWidth?: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <span className={`${labelWidth} shrink-0 truncate text-[8.5pt] text-gray-600`} title={label}>
                {label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(1, Math.min(100, value))}%`, background: colour }}
                />
            </div>
            <span className="w-9 shrink-0 text-right text-[8.5pt] font-semibold tabular-nums">
                {value.toFixed(0)}%
            </span>
        </div>
    );
}

/** A lecturer rating out of five, as a figure over a proportion bar. */
export function Rating({ label, score }: { label: string; score: number }) {
    return (
        <div>
            <div className="flex items-baseline gap-1">
                <span className="text-[13pt] font-bold leading-none tabular-nums">
                    {score.toFixed(1)}
                </span>
                <span className="text-[8pt] text-gray-400">/ 5</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                    className="h-full rounded-full"
                    style={{ width: `${(score / 5) * 100}%`, background: DONE_COLOUR }}
                />
            </div>
            <p className="mt-1 text-[7.5pt] text-gray-500">{label}</p>
        </div>
    );
}

/**
 * A completeness row: how many of a population have some property.
 *
 * Always states the denominator. "142 with subtitles" is a number nobody can act on;
 * "142 of 262" is the same number with the question attached.
 */
export function CoverageRow({
    label,
    have,
    total,
    note,
    neutral = false,
}: {
    label: string;
    have: number;
    total: number;
    note?: string;
    /**
     * Report the proportion without judging it. For rows where a low number is the expected
     * state rather than a shortfall — most videos correctly inherit their project's deadline
     * instead of carrying their own — colouring it as a failure teaches the reader to
     * distrust the rows that ARE failures.
     */
    neutral?: boolean;
}) {
    const pct = total > 0 ? (have / total) * 100 : 0;
    // Amber below three quarters: a gap this size stops being an exception and starts
    // being the reason a figure elsewhere is wrong.
    const colour = neutral
        ? INK.muted
        : pct >= 90 ? DONE_COLOUR : pct >= 75 ? SERIES[3] : IN_PRODUCTION_COLOUR;

    return (
        <li className="report-row grid grid-cols-[1fr_auto] items-center gap-x-4">
            <div className="min-w-0">
                <p className="truncate text-[9pt] leading-snug">{label}</p>
                {note && <p className="truncate text-[7.5pt] leading-snug text-gray-500">{note}</p>}
            </div>
            <div className="flex items-center gap-2.5">
                <div className="h-3 w-[40mm] overflow-hidden rounded-sm bg-gray-100">
                    <div style={{ width: `${pct}%`, height: '100%', background: colour }} />
                </div>
                <span className="w-16 text-right text-[8.5pt] font-semibold tabular-nums">
                    {have}/{total}
                </span>
            </div>
        </li>
    );
}
