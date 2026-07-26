// src/app/analytics/StackedWorkloadChart.tsx
"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartCard, EmptyState, Legend } from "./ui";
import { AXIS, INK, SERIES, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE, formatMinutes, truncate } from "./chart-theme";
import { Users } from "lucide-react";

type WorkloadData = {
    name: string;
    [key: string]: string | number;
};

type ChartProps = {
    data: WorkloadData[];
    title: string;
};

const MAX_LABEL_LEN = 20;
const BAR_SLOT = 46;

export default function StackedWorkloadChart({ data, title }: ChartProps) {
    const keys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== "name") : [];
    const rowTotal = (row: WorkloadData) =>
        keys.reduce((sum, k) => sum + (Number(row[k]) || 0), 0);

    const rows = data
        .map(row => ({ ...row, __total: rowTotal(row) }))
        .sort((a, b) => b.__total - a.__total);

    const chartHeight = Math.max(200, rows.length * BAR_SLOT + 40);

    if (rows.length === 0) {
        return (
            <ChartCard title={title} description="Finished minutes credited to each video's main editor.">
                <EmptyState icon={<Users className="h-8 w-8" />} title="No completed videos yet">
                    Minutes appear here once editors finish their first videos.
                </EmptyState>
            </ChartCard>
        );
    }

    const grandTotal = rows.reduce((sum, r) => sum + r.__total, 0);
    const mean = grandTotal / rows.length;
    const top = rows[0];
    // Concentration: how much of the team's output the single busiest editor carries.
    // A number worth watching — a high share is a bus-factor risk, not a compliment.
    const topShare = grandTotal > 0 ? (top.__total / grandTotal) * 100 : 0;

    // One project type means there is nothing to stack; a legend with a single swatch
    // would just restate the title, so it only appears when there is a real split.
    const isStacked = keys.length > 1;

    return (
        <ChartCard
            title={title}
            description="Finished runtime credited to each video's main editor. Translation work is excluded — it produces no new runtime."
            aside={
                isStacked ? (
                    <Legend items={keys.map((k, i) => ({ label: k, color: SERIES[i % SERIES.length] }))} />
                ) : (
                    <div className="text-right">
                        <p className="text-2xl font-semibold leading-none tracking-tight text-gray-900">
                            {formatMinutes(grandTotal)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">produced by {rows.length} editors</p>
                    </div>
                )
            }
            footnote={
                <>
                    Team average <span className="font-medium text-gray-700">{mean.toFixed(0)} minutes</span> per editor
                    (dashed line).{" "}
                    <span className="font-medium text-gray-700">{top.name}</span> carries {topShare.toFixed(0)}% of all
                    finished runtime. Credit follows the per-video main editor, so reassigning one video moves its
                    minutes with it.
                </>
            }
        >
            <div style={{ height: chartHeight }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {/* top: 22 leaves room for the "team avg" reference-line label, which recharts
                        draws above the plot area and will otherwise clip at the container edge. */}
                    <BarChart layout="vertical" data={rows} margin={{ top: 22, right: 68, left: 4, bottom: 4 }}>
                        <CartesianGrid horizontal={false} stroke={INK.grid} strokeWidth={1} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={160}
                            {...AXIS}
                            fontSize={13}
                            tickFormatter={(v: string) => truncate(v, MAX_LABEL_LEN)}
                        />
                        <XAxis
                            type="number"
                            {...AXIS}
                            fontSize={11}
                            allowDecimals={false}
                            tickFormatter={(v: number) => `${Math.round(v)}m`}
                        />
                        <Tooltip
                            cursor={{ fill: INK.grid, opacity: 0.35 }}
                            contentStyle={TOOLTIP_STYLE}
                            labelStyle={TOOLTIP_LABEL_STYLE}
                            formatter={(value: number, name: string) => [`${value.toFixed(1)} min`, name]}
                        />
                        <ReferenceLine
                            x={mean}
                            stroke={INK.axis}
                            strokeDasharray="4 4"
                            label={{
                                value: "team avg",
                                position: "top",
                                fontSize: 10,
                                fill: INK.muted,
                            }}
                        />
                        {keys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                stackId="workload"
                                fill={SERIES[index % SERIES.length]}
                                maxBarSize={24}
                                stroke={isStacked ? INK.surface : undefined}
                                strokeWidth={isStacked ? 2 : 0}
                                radius={index === keys.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                            >
                                {index === keys.length - 1 && (
                                    <LabelList
                                        dataKey="__total"
                                        position="right"
                                        offset={10}
                                        formatter={(v: unknown) =>
                                            typeof v === "number" ? `${v.toFixed(0)}m` : ""
                                        }
                                        style={{ fontSize: 12, fill: INK.secondary, fontWeight: 600 }}
                                    />
                                )}
                            </Bar>
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
