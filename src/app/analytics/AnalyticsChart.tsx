// src/app/analytics/AnalyticsChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type ChartData = {
  category: string;
  active_count: number;
  completed_count: number;
};

type ChartProps = {
  data: ChartData[];
  title: string;
  dataKey: "active_count" | "completed_count";
  fillColor: string;
};

export default function AnalyticsChart({ data, title, dataKey, fillColor }: ChartProps) {
  return (
    <div className="p-4 border rounded-lg bg-white">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <div className="mt-6 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 75 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="category" angle={-45} textAnchor="end" interval={0} height={100} stroke="#6b7280" fontSize={12} />
            <YAxis allowDecimals={false} stroke="#6b7280" fontSize={12} />
            <Tooltip
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
            />
            <Bar dataKey={dataKey} fill={fillColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}