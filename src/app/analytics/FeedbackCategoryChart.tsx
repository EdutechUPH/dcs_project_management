// src/app/analytics/FeedbackCategoryChart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
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

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

export default function FeedbackCategoryChart({ data, title }: ChartProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                type="number"
                                domain={[0, 5]}
                                hide
                            />
                            <YAxis
                                dataKey="category"
                                type="category"
                                width={120}
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#f9fafb', opacity: 0.5 }}
                                contentStyle={{
                                    background: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                                formatter={(value: number) => [value.toFixed(1) + " / 5.0", "Avg Score"]}
                            />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={40}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
