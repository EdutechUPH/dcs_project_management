// src/app/analytics/FeedbackCategoryChart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CategoryData = {
    category: string;
    score: number;
    fullLabel: string;
};

type ChartProps = {
    data: CategoryData[];
    title: string;
};

export default function FeedbackCategoryChart({ data, title }: ChartProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                            <XAxis
                                type="number"
                                domain={[0, 5]}
                                ticks={[0, 1, 2, 3, 4, 5]}
                                stroke="#6b7280"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                dataKey="category"
                                type="category"
                                width={80}
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#f9fafb', opacity: 0.6 }}
                                contentStyle={{
                                    background: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    fontSize: '12px',
                                }}
                                labelFormatter={(_label, payload) =>
                                    payload?.[0]?.payload?.fullLabel ?? _label
                                }
                                formatter={(value: number) => [value.toFixed(2) + ' / 5.00', 'Avg Score']}
                            />
                            <Bar
                                dataKey="score"
                                fill="#6366f1"
                                radius={[0, 6, 6, 0]}
                                barSize={28}
                                background={{ fill: '#f1f5f9', radius: 6 }}
                            >
                                <LabelList
                                    dataKey="score"
                                    position="right"
                                    formatter={(v: number) => v > 0 ? v.toFixed(1) : '—'}
                                    style={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
