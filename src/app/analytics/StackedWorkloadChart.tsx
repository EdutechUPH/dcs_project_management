// src/app/analytics/StackedWorkloadChart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WorkloadData = {
    name: string;
    [key: string]: string | number;
};

type ChartProps = {
    data: WorkloadData[];
    title: string;
};

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'];

const MAX_LABEL_LEN = 18;

export default function StackedWorkloadChart({ data, title }: ChartProps) {
    const keys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'name') : [];
    const barHeight = 52;
    const chartHeight = Math.max(200, data.length * barHeight + 60);

    if (data.length === 0) {
        return (
            <Card className="col-span-1 lg:col-span-2">
                <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                <CardContent>
                    <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                        No completed videos yet — data will appear once editors finish their first videos.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div style={{ height: chartHeight }} className="w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={150}
                                stroke="#6b7280"
                                fontSize={13}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v: string) =>
                                    v.length > MAX_LABEL_LEN ? v.slice(0, MAX_LABEL_LEN - 1) + '…' : v
                                }
                            />
                            <XAxis
                                type="number"
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                label={{ value: 'Minutes', position: 'insideBottomRight', offset: -4, fontSize: 11, fill: '#9ca3af' }}
                            />
                            <Tooltip
                                cursor={{ fill: '#f9fafb', opacity: 0.5 }}
                                contentStyle={{
                                    background: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                                formatter={(value: number, name: string) => [`${value.toFixed(1)}m`, name]}
                                labelFormatter={(label) => label}
                            />
                            <Legend verticalAlign="top" height={36} />
                            {keys.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    stackId="a"
                                    fill={COLORS[index % COLORS.length]}
                                    radius={index === keys.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
