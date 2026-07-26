// src/app/analytics/SatisfactionTrend.tsx
"use client";

import {
    Area,
    CartesianGrid,
    ComposedChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartCard } from "./ui";
import { AXIS, INK, SERIES, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from "./chart-theme";

type TrendData = {
    date: string;
    score: number;
    sortKey: number;
};

type ChartProps = {
    data: TrendData[];
    title: string;
};

export default function SatisfactionTrend({ data, title }: ChartProps) {
    const mean = data.reduce((sum, d) => sum + d.score, 0) / (data.length || 1);
    const latest = data[data.length - 1];
    const first = data[0];
    const drift = latest && first ? latest.score - first.score : 0;

    return (
        <ChartCard
            title={title}
            description="Final-product rating per week, from the form the lecturer fills in when a project is finished."
            footnote={
                <>
                    Mean {mean.toFixed(2)} across {data.length} {data.length === 1 ? "week" : "weeks"} with a response
                    {data.length > 1 && (
                        <>
                            {" "}
                            — {drift === 0 ? "flat" : drift > 0 ? `up ${drift.toFixed(1)}` : `down ${Math.abs(drift).toFixed(1)}`}{" "}
                            from the first week to the latest
                        </>
                    )}
                    . Weeks with no completed project simply have no point; the line does not interpolate them.
                </>
            }
        >
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                        <defs>
                            <linearGradient id="satisfactionWash" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.16} />
                                <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke={INK.grid} strokeWidth={1} />
                        <XAxis dataKey="date" {...AXIS} minTickGap={28} dy={6} />
                        <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} {...AXIS} width={28} />
                        <Tooltip
                            cursor={{ stroke: INK.axis, strokeWidth: 1 }}
                            contentStyle={TOOLTIP_STYLE}
                            labelStyle={TOOLTIP_LABEL_STYLE}
                            labelFormatter={label => `Week of ${label}`}
                            formatter={(value: number) => [`${value.toFixed(2)} / 5.00`, "Avg rating"]}
                        />
                        <ReferenceLine
                            y={mean}
                            stroke={INK.axis}
                            strokeDasharray="4 4"
                            label={{ value: "mean", position: "right", fontSize: 10, fill: INK.muted }}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke={SERIES[0]}
                            strokeWidth={2}
                            fill="url(#satisfactionWash)"
                            dot={{ r: 4, fill: SERIES[0], stroke: INK.surface, strokeWidth: 2 }}
                            activeDot={{ r: 5.5, fill: SERIES[0], stroke: INK.surface, strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
