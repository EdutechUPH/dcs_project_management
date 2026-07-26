// src/app/analytics/ui.tsx
//
// Shared presentation primitives for the analytics page. Every card, tile and
// heading on the page is built from these, so spacing, type scale and colour stay
// consistent across three tabs without each chart re-inventing its own frame.
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { INK, SERIES, STATUS, compactNumber } from "./chart-theme";

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
    description?: React.ReactNode;
    /** Rendered top-right — a legend, a scope note, a total. */
    aside?: React.ReactNode;
    /** Small print under the plot: caveats, exclusions, how the number is derived. */
    footnote?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
};

export function ChartCard({ title, description, aside, footnote, className, children }: ChartCardProps) {
    return (
        <Card className={cn("border-gray-200/80 shadow-sm", className)}>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold tracking-tight text-gray-900">{title}</h3>
                        {description && <p className="max-w-3xl text-sm text-gray-500">{description}</p>}
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
    hint?: string;
    icon?: React.ReactNode;
    tone?: Tone;
    /** 0–100. Renders a meter under the value; the track is a lighter step of the fill. */
    meter?: number | null;
    sparkline?: number[];
    /** Makes this the one lead figure of the view. */
    hero?: boolean;
};

export function StatTile({
    label,
    value,
    unit,
    hint,
    icon,
    tone = "neutral",
    meter = null,
    sparkline,
    hero = false,
}: StatTileProps) {
    return (
        <Card className="relative overflow-hidden border-gray-200/80 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-[0.06em] text-gray-500">{label}</p>
                    {icon && <span className="shrink-0 text-gray-400">{icon}</span>}
                </div>

                <div className="mt-2 flex items-end gap-1.5">
                    <span
                        className={cn(
                            "font-semibold leading-none tracking-tight",
                            hero ? "text-[2.75rem]" : "text-[1.75rem]",
                            TONE_TEXT[tone]
                        )}
                    >
                        {value}
                    </span>
                    {unit && <span className="pb-1 text-sm font-normal text-gray-500">{unit}</span>}
                </div>

                {meter != null && (
                    <div
                        className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
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
                )}

                {sparkline && sparkline.length > 1 && (
                    <div className="mt-3">
                        <Sparkline values={sparkline} color={TONE_FILL[tone]} />
                    </div>
                )}

                {hint && <p className="mt-2.5 text-xs leading-relaxed text-gray-500">{hint}</p>}
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
