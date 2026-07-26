// src/app/analytics/PortfolioBreakdown.tsx
"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartCard, EmptyState, Legend } from "./ui";
import { AXIS, INK, SERIES, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE, truncate } from "./chart-theme";
import { BarChart3 } from "lucide-react";

type Row = {
    category: string;
    full_category: string;
    active_count: number;
    completed_count: number;
};

type Props = {
    data: Row[];
    /** Human-readable name of the current grouping, e.g. "faculty". */
    groupLabel: string;
};

const MAX_LABEL_LEN = 20;
const BAR_SLOT = 40;

/**
 * Replaces the previous pair of side-by-side charts (one for active, one for
 * completed). Two charts of the same categories forced the reader to hop between
 * them to answer the actual question — how much of this group's work is finished —
 * and the two charts sorted differently. One stacked bar answers it directly.
 */
export default function PortfolioBreakdown({ data, groupLabel }: Props) {
    const rows = data
        .map(d => ({ ...d, total: d.active_count + d.completed_count }))
        .filter(d => d.total > 0)
        .sort((a, b) => b.total - a.total);

    const height = Math.max(200, rows.length * BAR_SLOT + 40);
    const totalCompleted = rows.reduce((s, r) => s + r.completed_count, 0);
    const totalAll = rows.reduce((s, r) => s + r.total, 0);

    if (rows.length === 0) {
        return (
            <ChartCard title={`Delivery by ${groupLabel}`} description="Finished versus in-flight videos.">
                <EmptyState icon={<BarChart3 className="h-8 w-8" />} title="No videos in scope">
                    Widen the filters to see the breakdown.
                </EmptyState>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title={`Delivery by ${groupLabel}`}
            description="Every video in scope, split by whether it is finished or still in flight. Sorted by total volume."
            aside={
                <Legend
                    items={[
                        { label: "Completed", color: SERIES[0] },
                        { label: "In flight", color: SERIES[1] },
                    ]}
                />
            }
            footnote={
                totalAll > 0 ? (
                    <>
                        <span className="font-medium text-gray-700">
                            {((totalCompleted / totalAll) * 100).toFixed(0)}% complete
                        </span>{" "}
                        overall — {totalCompleted} of {totalAll} videos across {rows.length}{" "}
                        {rows.length === 1 ? groupLabel : `${groupLabel}s`}. In-flight excludes videos in Pending or
                        Cancelled projects.
                    </>
                ) : undefined
            }
        >
            <div style={{ height }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={rows} margin={{ top: 4, right: 56, left: 4, bottom: 4 }}>
                        <CartesianGrid horizontal={false} stroke={INK.grid} strokeWidth={1} />
                        <YAxis
                            type="category"
                            dataKey="category"
                            width={150}
                            {...AXIS}
                            fontSize={13}
                            tickFormatter={(v: string) => truncate(v, MAX_LABEL_LEN)}
                        />
                        <XAxis type="number" allowDecimals={false} {...AXIS} fontSize={11} />
                        <Tooltip
                            cursor={{ fill: INK.grid, opacity: 0.35 }}
                            contentStyle={TOOLTIP_STYLE}
                            labelStyle={TOOLTIP_LABEL_STYLE}
                            labelFormatter={(label, payload) => payload?.[0]?.payload?.full_category ?? label}
                            formatter={(value: number, name: string) => [value, name]}
                        />
                        {/* The 2px surface-coloured stroke is the gap between stacked segments,
                            not a border — it lets neighbouring fills read as distinct without ink. */}
                        <Bar
                            dataKey="completed_count"
                            name="Completed"
                            stackId="videos"
                            fill={SERIES[0]}
                            maxBarSize={24}
                            stroke={INK.surface}
                            strokeWidth={2}
                        />
                        <Bar
                            dataKey="active_count"
                            name="In flight"
                            stackId="videos"
                            fill={SERIES[1]}
                            maxBarSize={24}
                            stroke={INK.surface}
                            strokeWidth={2}
                            radius={[0, 4, 4, 0]}
                        >
                            {rows.map(row => (
                                // Square the cap when there is no in-flight segment to round.
                                <Cell key={row.category} fill={SERIES[1]} radius={row.active_count > 0 ? 4 : 0} />
                            ))}
                            <LabelList
                                dataKey="total"
                                position="right"
                                offset={10}
                                style={{ fontSize: 12, fill: INK.secondary, fontWeight: 600 }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
