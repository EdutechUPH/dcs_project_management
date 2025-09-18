// src/app/analytics/FacultyOutputChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type FacultyOutputData = {
  faculty_name: string;
  completed_videos: number;
}[];

export default function FacultyOutputChart({ data }: { data: FacultyOutputData }) {
  return (
    <div className="p-4 border rounded-lg bg-white">
      <h2 className="text-lg font-semibold text-gray-800">Completed Videos per Faculty</h2>
      <p className="text-sm text-gray-600 mt-1">Total count of videos marked as "Done"</p>
      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} stroke="#6b7280" fontSize={12} />
            <YAxis type="category" dataKey="faculty_name" width={100} stroke="#6b7280" fontSize={12} />
            <Tooltip
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
            />
            <Bar dataKey="completed_videos" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}