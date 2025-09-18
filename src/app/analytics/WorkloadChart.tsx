// src/app/analytics/WorkloadChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
// The import from '@tremor/react' has been removed.

type WorkloadData = {
  member_name: string;
  active_videos: number;
}[];

export default function WorkloadChart({ data }: { data: WorkloadData }) {
  if (data.length === 0) {
    // Replaced <Card>, <Title>, <Text> with standard elements
    return (
      <div className="p-4 border rounded-lg bg-white">
        <h2 className="text-lg font-semibold text-gray-800">Active Videos per Team Member</h2>
        <p className="text-sm text-gray-600 mt-1">No active assignments found to display.</p>
      </div>
    );
  }

  return (
    // Replaced <Card>, <Title>, <Text> with standard elements
    <div className="p-4 border rounded-lg bg-white">
      <h2 className="text-lg font-semibold text-gray-800">Active Videos per Team Member</h2>
      <p className="text-sm text-gray-600 mt-1">Count of videos with a status other than "Done"</p>
      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="member_name" stroke="#6b7280" fontSize={12} />
            <YAxis allowDecimals={false} stroke="#6b7280" fontSize={12} />
            <Tooltip
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
            />
            <Bar dataKey="active_videos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}