// src/app/analytics/AnalyticsChart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartData = {
  category: string;
  active_count: number;
  completed_count: number;
  full_category?: string;
};

type ChartProps = {
  data: ChartData[];
  title: string;
  dataKey: "active_count" | "completed_count";
  fillColor: string;
};

const MAX_LABEL_LEN = 22;
const BAR_HEIGHT = 44;

export default function AnalyticsChart({ data, title, dataKey, fillColor }: ChartProps) {
  const filtered = data.filter(d => (d[dataKey] ?? 0) > 0);
  const chartHeight = Math.max(180, filtered.length * BAR_HEIGHT + 48);

  if (filtered.length === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div style={{ height: chartHeight }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={filtered}
              margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <YAxis
                type="category"
                dataKey="category"
                width={140}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) =>
                  v.length > MAX_LABEL_LEN ? v.slice(0, MAX_LABEL_LEN - 1) + '…' : v
                }
              />
              <XAxis
                type="number"
                allowDecimals={false}
                stroke="#6b7280"
                fontSize={11}
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
                  payload?.[0]?.payload?.full_category ?? _label
                }
                formatter={(value: number) => [value, dataKey === 'active_count' ? 'Active' : 'Completed']}
              />
              <Bar dataKey={dataKey} fill={fillColor} radius={[0, 6, 6, 0]} maxBarSize={32}>
                <LabelList
                  dataKey={dataKey}
                  position="right"
                  style={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
