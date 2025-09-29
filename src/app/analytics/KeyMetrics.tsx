// src/app/analytics/KeyMetrics.tsx
'use client';

import { PlaySquare, Clock } from "lucide-react";

type KeyMetricsProps = {
  data: {
    total_videos_completed: number;
    total_duration_minutes: number;
    total_duration_seconds: number;
  } | null;
};

// A simple component for each card
const StatCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number}) => (
  <div className="bg-white p-4 rounded-lg border flex items-center">
    <div className="mr-4 text-gray-800">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);


export default function KeyMetrics({ data }: KeyMetricsProps) {
  if (!data) {
    return null; // Don't render if there's no data
  }

  // Calculate total duration in hours and minutes
  const totalMinutes = (data.total_duration_minutes || 0) + Math.floor((data.total_duration_seconds || 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const durationString = `${hours}h ${minutes}m`;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<PlaySquare size={32} />} 
          title="Total Videos Completed" 
          value={data.total_videos_completed || 0} 
        />
        <StatCard 
          icon={<Clock size={32} />} 
          title="Total Duration Produced" 
          value={durationString} 
        />
        {/* We can add more cards here in the future */}
      </div>
    </div>
  );
}