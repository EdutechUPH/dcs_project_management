// src/app/analytics/FeedbackCategoryChart.tsx
"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartCard, EmptyState } from "./ui";
import { AXIS, INK, SERIES, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from "./chart-theme";
import { MessageSquareQuote } from "lucide-react";

type CategoryData = {
    category: string;
    score: number;
    fullLabel: string;
};

type ChartProps = {
    data: CategoryData[];
    title: string;
    /** Projects whose feedback form is behind these averages. */
    responses: number;
};

export default function FeedbackCategoryChart({ data, title, responses }: ChartProps) {
    const scored = data.filter(d => d.score > 0);

    if (scored.length === 0) {
        return (
            <ChartCard title={title} description="Average lecturer rating per category, out of 5.">
                <EmptyState icon={<MessageSquareQuote className="h-8 w-8" />} title="No feedback submitted yet">
                    Category averages appear once lecturers start returning the completed-project form.
                </EmptyState>
            </ChartCard>
        );
    }

    const overall = scored.reduce((sum, d) => sum + d.score, 0) / scored.length;
    const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
    const worst = scored.reduce((a, b) => (b.score < a.score ? b : a));

    return (
        <ChartCard
            title={title}
            description={`Average lecturer rating out of 5, across ${responses} completed ${responses === 1 ? "project" : "projects"} that returned the form.`}
            footnote={
                <>
                    Strongest: <span className="font-medium text-gray-700">{best.fullLabel}</span> at{" "}
                    {best.score.toFixed(2)}. Weakest:{" "}
                    <span className="font-medium text-gray-700">{worst.fullLabel}</span> at {worst.score.toFixed(2)}.
                    The dashed line is the overall mean of {overall.toFixed(2)} — a category below it is where the next
                    improvement is worth the most.
                </>
            }
        >
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {/* top: 22 leaves room for the "mean" reference-line label, which recharts
                        draws above the plot area and will otherwise clip at the container edge. */}
                    <BarChart data={data} layout="vertical" margin={{ top: 22, right: 52, left: 4, bottom: 4 }}>
                        <CartesianGrid horizontal={false} stroke={INK.grid} strokeWidth={1} />
                        <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} {...AXIS} fontSize={11} />
                        <YAxis dataKey="category" type="category" width={92} {...AXIS} fontSize={12} />
                        <Tooltip
                            cursor={{ fill: INK.grid, opacity: 0.35 }}
                            contentStyle={TOOLTIP_STYLE}
                            labelStyle={TOOLTIP_LABEL_STYLE}
                            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullLabel ?? label}
                            formatter={(value: number) => [`${value.toFixed(2)} / 5.00`, "Average rating"]}
                        />
                        <ReferenceLine
                            x={overall}
                            stroke={INK.axis}
                            strokeDasharray="4 4"
                            label={{ value: "mean", position: "top", fontSize: 10, fill: INK.muted }}
                        />
                        <Bar dataKey="score" fill={SERIES[0]} maxBarSize={22} radius={[0, 4, 4, 0]}>
                            {data.map(d => (
                                // Below-average categories take the warm slot so the weak spot is
                                // findable at a glance; the value label carries the meaning either way.
                                <Cell key={d.category} fill={d.score < overall ? SERIES[1] : SERIES[0]} />
                            ))}
                            <LabelList
                                dataKey="score"
                                position="right"
                                offset={10}
                                formatter={(v: unknown) => (typeof v === "number" && v > 0 ? v.toFixed(2) : "—")}
                                style={{ fontSize: 12, fill: INK.secondary, fontWeight: 600 }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
