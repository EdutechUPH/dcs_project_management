// src/app/analytics/VideoCompletionTrend.tsx
"use client";

import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartCard, Legend } from "./ui";
import { AXIS, INK, SERIES, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from "./chart-theme";

type TrendData = {
    date: string;
    count: number;
    sortKey: number;
};

type ChartProps = {
    data: TrendData[];
    title: string;
    /** Completed videos with no recorded approval date, excluded from the chart. */
    excludedCount?: number;
};

const WINDOW = 4;

export default function VideoCompletionTrend({ data, title, excludedCount = 0 }: ChartProps) {
    // A 4-week trailing mean. Weekly throughput in a team this size is spiky enough
    // that the raw line invites reading noise as a trend; the mean is what you
    // actually plan capacity against, so both are plotted and both are named.
    const series = data.map((point, i) => {
        const window = data.slice(Math.max(0, i - WINDOW + 1), i + 1);
        const mean = window.reduce((sum, p) => sum + p.count, 0) / window.length;
        return { ...point, mean: Math.round(mean * 10) / 10 };
    });

    const peak = data.reduce((best, p) => (p.count > best.count ? p : best), data[0]);
    const totalPlotted = data.reduce((sum, p) => sum + p.count, 0);
    const avgPerWeek = data.length > 0 ? totalPlotted / data.length : 0;

    return (
        <ChartCard
            title={title}
            description="Each finished video is dated by the lecturer's approval — the only per-video completion timestamp the system records."
            aside={
                <Legend
                    items={[
                        { label: "Videos completed", color: SERIES[0] },
                        { label: `${WINDOW}-week average`, color: SERIES[1] },
                    ]}
                />
            }
            footnote={
                <>
                    Averaging <span className="font-medium text-gray-700">{avgPerWeek.toFixed(1)} videos per week</span>{" "}
                    across the {data.length} {data.length === 1 ? "week" : "weeks"} plotted
                    {peak ? `, peaking at ${peak.count} in the week of ${peak.date}` : ""}.
                    {excludedCount > 0 && (
                        <>
                            {" "}
                            {excludedCount} completed {excludedCount === 1 ? "video has" : "videos have"} no recorded
                            approval date and {excludedCount === 1 ? "is" : "are"} not shown — approval logging began in
                            January 2026, so earlier work cannot be dated without inventing a date for it.
                        </>
                    )}
                </>
            }
        >
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={series} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                        <defs>
                            <linearGradient id="completionWash" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.16} />
                                <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke={INK.grid} strokeWidth={1} />
                        <XAxis dataKey="date" {...AXIS} minTickGap={28} dy={6} />
                        <YAxis {...AXIS} allowDecimals={false} width={36} />
                        <Tooltip
                            cursor={{ stroke: INK.axis, strokeWidth: 1 }}
                            contentStyle={TOOLTIP_STYLE}
                            labelStyle={TOOLTIP_LABEL_STYLE}
                            labelFormatter={label => `Week of ${label}`}
                            formatter={(value: number, name: string) => [
                                typeof value === "number" ? value.toFixed(name === "Videos completed" ? 0 : 1) : value,
                                name,
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            name="Videos completed"
                            stroke={SERIES[0]}
                            strokeWidth={2}
                            fill="url(#completionWash)"
                            dot={false}
                            activeDot={{ r: 4.5, fill: SERIES[0], stroke: INK.surface, strokeWidth: 2 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="mean"
                            name={`${WINDOW}-week average`}
                            stroke={SERIES[1]}
                            strokeWidth={2}
                            strokeLinecap="round"
                            dot={false}
                            activeDot={{ r: 4.5, fill: SERIES[1], stroke: INK.surface, strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
