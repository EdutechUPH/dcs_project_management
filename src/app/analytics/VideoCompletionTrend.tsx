// src/app/analytics/VideoCompletionTrend.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TrendData = {
    date: string; // "Jan 2024", "Feb 2024" etc.
    count: number;
    sortKey: number; // YYYYMM for sorting
};

type ChartProps = {
    data: TrendData[];
    title: string;
};

export default function VideoCompletionTrend({ data, title }: ChartProps) {
    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                allowDecimals={false}
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Line
                                type="monotone"
                                dataKey="count"
                                name="Videos Completed"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                activeDot={{ r: 6 }}
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
