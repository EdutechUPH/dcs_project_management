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

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

export default function StackedWorkloadChart({ data, title }: ChartProps) {
    // Extract all keys except 'name' to identify the project types dynamically
    const keys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'name') : [];

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={80}
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                label={{ value: 'Minutes Produced', angle: -90, position: 'insideLeft' }}
                                allowDecimals={false}
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
                                labelFormatter={(label, payload) => {
                                    if (payload && payload.length > 0) {
                                        // The payload in Stacked Chart is a bit different, it contains the whole data object
                                        return payload[0].payload.name || label;
                                        // Note: For StackedChart, 'name' IS the label/category. 
                                        // If we want FULL name, we need to pass it in data.
                                        // In AnalyticsPage, we are constructing workloadData.
                                    }
                                    return label;
                                }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            {keys.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    stackId="a"
                                    fill={COLORS[index % COLORS.length]}
                                    radius={[0, 0, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
