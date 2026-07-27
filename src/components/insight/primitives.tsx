// src/components/insight/primitives.tsx
//
// Shared presentation primitives for data-heavy pages — analytics and the projects
// dashboard both build every card, tile and heading from these, so spacing, type
// scale and colour stay consistent without each view re-inventing its own frame.
//
// Lives outside src/app/analytics because it is not analytics-specific; the old
// analytics paths re-export from here so existing imports keep working.
"use client";

import { Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { INK, SERIES, STATUS, compactNumber } from "./tokens";

// ---------------------------------------------------------------------------
// Info note — the caveat that would otherwise be permanent small print
// ---------------------------------------------------------------------------

/**
 * An ⓘ carrying an explanation on hover and focus.
 *
 * The pattern this codebase settled on for anything that is true, worth stating once,
 * and not worth reading every day: how a figure is derived, what it quietly includes,
 * why it may not reconcile with a number elsewhere. Written out in full these crowded
 * out the data; deleted, people mistrust figures they cannot account for.
 *
 * A native `title` rather than a tooltip component — no JavaScript, works in server
 * components, and matches how the term pills already explain themselves. `tabIndex`
 * and `aria-label` keep it reachable without a mouse.
 */
export function InfoNote({ note, className }: { note: string; className?: string }) {
    return (
        <span
            tabIndex={0}
            role="note"
            aria-label={note}
            title={note}
            className={cn(
                "inline-flex shrink-0 cursor-help text-gray-400 transition-colors hover:text-gray-600 focus:text-gray-600 focus:outline-none",
                className,
            )}
        >
            <Info className="h-3.5 w-3.5" />
        </span>
    );
}

// ---------------------------------------------------------------------------
// Section heading — groups cards into a labelled band inside a tab
// ---------------------------------------------------------------------------

export function SectionHeading({ title, description }: { title: string; description?: string }) {
    return (
        <div className="space-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">{title}</h2>
            {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Chart card — one frame for every chart, so titles and padding never drift
// ---------------------------------------------------------------------------

type ChartCardProps = {
    title: string;
    /**
     * Scope or caveat, shown as an ⓘ beside the title.
     *
     * Prefer this to `description` for anything that qualifies the card rather than
     * introducing it — "live projects only", "excludes cancelled work". Those sentences
     * are read once and then occupy a line forever.
     */
    titleNote?: string;
    description?: React.ReactNode;
    /**
     * What is NOT in the view, as a badge beside the title.
     *
     * The one thing a reader cannot work out from the chart itself. It was previously
     * buried at the end of a paragraph of small print — the completion trend's footnote
     * opened with an average and a peak, then mentioned in passing that 201 of 262 videos
     * were missing from the line. Shorter here, and impossible to skip.
     *
     * `tone: "warning"` for an exclusion big enough to change how the chart is read.
     */
    coverage?: { label: string; note: string; tone?: "neutral" | "warning" };
    /** Rendered top-right — a legend, a scope note, a total. */
    aside?: React.ReactNode;
    /** Small print under the plot: caveats, exclusions, how the number is derived. */
    footnote?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
};

export function ChartCard({
    title,
    titleNote,
    description,
    coverage,
    aside,
    footnote,
    className,
    children,
}: ChartCardProps) {
    return (
        <Card className={cn("border-gray-200/80 shadow-sm", className)}>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Clear step between the two. They were 16px semibold over 14px regular —
                        close enough that the description read as a second title rather than as
                        its caption, and the card's name did not lead. */}
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <div className="flex items-center gap-1.5">
                                <h3 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h3>
                                {titleNote && <InfoNote note={titleNote} />}
                            </div>
                            {coverage && (
                                // The badge is its own affordance — no separate ⓘ beside it,
                                // which would put two of them within a few pixels of each other.
                                <span
                                    tabIndex={0}
                                    role="note"
                                    aria-label={coverage.note}
                                    title={coverage.note}
                                    className={cn(
                                        "cursor-help whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium",
                                        coverage.tone === "warning"
                                            ? "bg-[#faf1e2] text-[#8a5a00]"
                                            : "bg-gray-100 text-gray-600",
                                    )}
                                >
                                    {coverage.label}
                                </span>
                            )}
                        </div>
                        {description && <p className="max-w-3xl text-xs leading-relaxed text-gray-500">{description}</p>}
                    </div>
                    {aside && <div className="shrink-0">{aside}</div>}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {children}
                {footnote && (
                    <p className="mt-4 border-t border-dashed border-gray-200 pt-3 text-xs leading-relaxed text-gray-500">
                        {footnote}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Legend — identity never rests on colour-matching alone
// ---------------------------------------------------------------------------

export function Legend({ items }: { items: { label: string; color: string }[] }) {
    return (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {items.map(item => (
                <li key={item.label} className="flex items-center gap-2 text-xs text-gray-600">
                    <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                        style={{ background: item.color }}
                    />
                    {item.label}
                </li>
            ))}
        </ul>
    );
}

// ---------------------------------------------------------------------------
// Sparkline — 2px line, no axes, endpoint dot. Context for a stat tile, not a chart.
// ---------------------------------------------------------------------------

export function Sparkline({
    values,
    color = SERIES[0],
    width = 132,
    height = 34,
}: {
    values: number[];
    color?: string;
    width?: number;
    height?: number;
}) {
    if (values.length < 2) return null;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    const pad = 4;
    const stepX = (width - pad * 2) / (values.length - 1);
    const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);

    const points = values.map((v, i) => [pad + i * stepX, y(v)] as const);
    const line = points.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
    const area = `${line} L${points[points.length - 1][0].toFixed(1)} ${height} L${points[0][0].toFixed(1)} ${height} Z`;
    const [lastX, lastY] = points[points.length - 1];

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
            <path d={area} fill={color} fillOpacity={0.1} />
            <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {/* 2px surface ring keeps the end dot legible where it crosses the line */}
            <circle cx={lastX} cy={lastY} r={3.5} fill={color} stroke={INK.surface} strokeWidth={2} />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Stat tile — label · value · context, optional meter or sparkline
// ---------------------------------------------------------------------------

type Tone = "neutral" | "good" | "warning" | "critical";

const TONE_TEXT: Record<Tone, string> = {
    neutral: "text-gray-900",
    good: "text-[#0a7d0a]",
    warning: "text-[#a06a00]",
    critical: "text-[#b32f2f]",
};

const TONE_FILL: Record<Tone, string> = {
    neutral: SERIES[0],
    good: STATUS.good,
    warning: STATUS.warning,
    critical: STATUS.critical,
};

export type StatTileProps = {
    label: string;
    value: string;
    /** Small unit rendered after the value at text weight, e.g. "/5". */
    unit?: string;
    /** Noun under the figure — "projects", "videos". Only needed when `secondary` is set. */
    valueLabel?: string;
    /**
     * A second figure of equal standing, shown beside the first behind a hairline.
     *
     * For a state that is counted in two units at once — projects AND the videos inside
     * them. Both are the answer, so neither is demoted to a `hint`: a row of tiles where
     * one card says "6" and another says "105" invites the reader to compare two numbers
     * that were never comparable. Paired, each card is one state read two ways.
     *
     * The secondary never wears `tone`. One alarm-coloured figure per card is a signal;
     * two is just a red card.
     */
    secondary?: { value: string; label: string };
    /** Short caption under the figures — aim for five words or fewer. */
    hint?: string;
    /**
     * The caveat behind an ⓘ: how the figure is derived, what it includes, why it might
     * not reconcile with a number elsewhere.
     *
     * Split from `hint` so the row can be scanned without being read. Deleting these
     * outright would be worse than the clutter they caused — "262 videos delivered"
     * counts videos inside projects that are still running, and someone reconciling it
     * against the completed-projects figure needs that available, just not in their face.
     */
    note?: string;
    icon?: React.ReactNode;
    /**
     * Hex colour for the icon chip. Gives a row of tiles distinct identities so they can be
     * told apart at a glance, without implying the FIGURE means something good or bad — that
     * stays the job of `tone`. Omit for the plain treatment.
     *
     * Deliberately bounded to the chip. This used to also paint a 3px rule across the top of
     * the card; that read as decoration stretched across the whole tile and is a tell of
     * generated dashboards. Contained behind the icon, the same colour still separates four
     * tiles at a glance without competing with the figure.
     */
    accent?: string;
    tone?: Tone;
    /** 0–100. Renders a meter under the value; the track is a lighter step of the fill. */
    meter?: number | null;
    /**
     * Caption printed to the RIGHT of the meter rather than on its own line.
     *
     * The row of tiles is only as short as its tallest member, and the tile with a meter
     * was that member: it carried a bar and a separate line of text saying what the bar
     * meant. Sharing one line removes a line from the card that sets the height, which is
     * the only place removing a line actually shortens the row.
     */
    meterLabel?: string;
    sparkline?: number[];
    /** Makes this the one lead figure of the view. */
    hero?: boolean;
};

/**
 * One figure and the noun beneath it.
 *
 * Exists so the primary and secondary figures in a tile are structurally identical —
 * the alignment between them depends on it, and two hand-written near-copies drifted
 * apart the moment one of them gained a `unit`.
 */
function Figure({
    value,
    unit,
    label,
    size = "normal",
    className,
    wrapperClassName,
}: {
    value: string;
    unit?: string;
    label?: string;
    size?: "normal" | "hero";
    className?: string;
    wrapperClassName?: string;
}) {
    return (
        <div className={cn("min-w-0", wrapperClassName)}>
            {/* Number and noun share a baseline instead of stacking. Two lines per figure
                made a four-tile row four lines deep before anything else was added; on one
                line the pairing still reads ("6 projects", "105 videos in production") and
                the row loses a line per tile. */}
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span
                    className={cn(
                        "font-semibold leading-none tracking-tight",
                        size === "hero" ? "text-[2.5rem]" : "text-2xl",
                        className,
                    )}
                >
                    {value}
                </span>
                {unit && <span className="text-sm font-normal text-gray-500">{unit}</span>}
                {label && <span className="text-xs leading-snug text-gray-500">{label}</span>}
            </div>
        </div>
    );
}

export function StatTile({
    label,
    value,
    unit,
    valueLabel,
    secondary,
    hint,
    note,
    icon,
    accent,
    tone = "neutral",
    meter = null,
    meterLabel,
    sparkline,
    hero = false,
}: StatTileProps) {
    return (
        <Card className="h-full border-gray-200/80 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-4">
                {/* Icon and title sit together as one unit at the top-left, and the title
                    carries real weight.

                    Before this, four tiles were told apart only by a small grey caption in
                    the corner furthest from an icon it had no visible relationship to — the
                    element identifying the card was the quietest thing on it. Position and
                    weight do that job here rather than colour, because a coloured label
                    would make the palette mean identity as well as state (AI_README §12);
                    the chip beside it is the swatch that carries identity. */}
                <div className="flex items-center gap-2.5">
                    {icon && (
                        accent ? (
                            // 1a = ~10% alpha, so the chip reads as a tint of the accent on white.
                            <span
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                style={{ background: `${accent}1a`, color: accent }}
                            >
                                {icon}
                            </span>
                        ) : (
                            <span className="shrink-0 text-gray-400">{icon}</span>
                        )
                    )}
                    <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.05em] text-gray-800">
                        {label}
                    </p>
                    {/* The ⓘ lives up here rather than trailing the caption, so a tile with
                        nothing worth captioning spends no vertical space on an empty line
                        just to hold its tooltip. */}
                    {note && <InfoNote note={note} className="ml-auto" />}
                </div>


                {/* Both figures use the SAME markup, which is what keeps their labels on a
                    shared baseline. They previously differed — the primary wrapped its value
                    in a flex row (blockifying the span to exactly its leading-none height)
                    while the secondary left a bare inline span in a block, picking up an
                    anonymous line box sized by the inherited line-height. Two different
                    heights, so the two labels sat a few pixels apart on every card. */}
                <div className="mt-2.5 flex items-start gap-4">
                    <Figure
                        value={value}
                        unit={unit}
                        label={valueLabel}
                        size={hero ? "hero" : "normal"}
                        className={TONE_TEXT[tone]}
                    />

                    {secondary && (
                        // Hairline rather than a middle dot: the two figures count different
                        // things, so they need separating, not joining into one reading.
                        <Figure
                            value={secondary.value}
                            label={secondary.label}
                            className="text-gray-900"
                            wrapperClassName="border-l border-gray-200 pl-4"
                        />
                    )}
                </div>

                {/* Below the figures, never above. Every tile in a row reads the same way —
                    title, then the number — so the eye can run along the row without one
                    card's caption pushing its figure out of line with the others. */}
                {hint && <p className="mt-1.5 text-xs leading-snug text-gray-500">{hint}</p>}

                {meter != null && (
                    <div className="mt-2.5 flex items-center gap-2">
                        <div
                            className="h-1.5 flex-1 overflow-hidden rounded-full"
                            style={{ background: INK.track }}
                            role="presentation"
                        >
                            <div
                                className="h-full rounded-full transition-[width]"
                                style={{
                                    width: `${Math.max(0, Math.min(100, meter))}%`,
                                    background: TONE_FILL[tone],
                                }}
                            />
                        </div>
                        {meterLabel && (
                            <span className="shrink-0 text-xs text-gray-500">{meterLabel}</span>
                        )}
                    </div>
                )}

                {sparkline && sparkline.length > 1 && (
                    <div className="mt-2.5">
                        <Sparkline values={sparkline} color={TONE_FILL[tone]} />
                    </div>
                )}

            </CardContent>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Share bar — an inline proportion inside a table cell
// ---------------------------------------------------------------------------

export function ShareBar({ value, color = SERIES[0] }: { value: number; color?: string }) {
    return (
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: INK.track }}>
            <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color }}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Empty state — said plainly, never a plot of zeroes
// ---------------------------------------------------------------------------

export function EmptyState({
    icon,
    title,
    children,
    className,
}: {
    icon?: React.ReactNode;
    title: string;
    children?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-10 text-center",
                className
            )}
        >
            {icon && <div className="mb-3 text-gray-400">{icon}</div>}
            <p className="font-medium text-gray-700">{title}</p>
            {children && <div className="mt-2 max-w-xl text-sm text-gray-500">{children}</div>}
        </div>
    );
}

/** Compact "n of m" caption used under charts. */
export function scopeNote(count: number, noun: string, total?: number) {
    const head = `${compactNumber(count)} ${count === 1 ? noun : `${noun}s`}`;
    return total != null ? `${head} of ${compactNumber(total)}` : head;
}
