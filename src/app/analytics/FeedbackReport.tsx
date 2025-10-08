// src/app/analytics/FeedbackReport.tsx
'use client';

import { type FeedbackSummary } from "@/lib/types";

// A simple component to display a single statistic
const StatCard = ({ title, rating }: { title: string; rating: number | null }) => {
  const displayRating = rating ? rating.toFixed(1) : 'N/A';
  return (
    <div className="p-4 border rounded-lg bg-white text-center">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{displayRating}<span className="text-lg text-gray-400"> / 5</span></p>
    </div>
  );
};

export default function FeedbackReport({ data }: { data: FeedbackSummary[] }) {
  // Supabase returns an array with one object, so we get the first item.
  const summary = data?.[0];

  return (
    <div className="lg:col-span-2"> {/* This component will span two columns in the grid */}
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Feedback & Quality Analysis</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Pre-Production" rating={summary?.avg_pre_production} />
        <StatCard title="Communication" rating={summary?.avg_communication} />
        <StatCard title="Video Quality" rating={summary?.avg_quality} />
        <StatCard title="Timeliness" rating={summary?.avg_timeliness} />
        <StatCard title="Final Product" rating={summary?.avg_final_product} />
        <StatCard title="Recommendation" rating={summary?.avg_recommendation} />
      </div>
    </div>
  );
}