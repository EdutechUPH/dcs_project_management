// src/app/analytics/KeyMetrics.tsx
"use client";

import { PlaySquare, Clock, Video, Film } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KeyMetricsProps = {
  data: {
    total_videos_completed: number;
    total_duration_minutes: number;
    total_duration_seconds: number;
    avg_satisfaction_score?: number | null;
  } | null;
};

export default function KeyMetrics({ data }: KeyMetricsProps) {
  if (!data) return null;

  const totalMinutes = (data.total_duration_minutes || 0) + Math.floor((data.total_duration_seconds || 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Format: "12h 30m" or just "45m"
  const durationString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Videos Completed</CardTitle>
          <PlaySquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total_videos_completed}</div>
          <p className="text-xs text-muted-foreground">
            Projects reached &quot;Done&quot; status
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Duration Produced</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{durationString}</div>
          <p className="text-xs text-muted-foreground">
            Combined runtime of all done videos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Satisfaction</CardTitle>
          <div className="text-yellow-500">
            {/* Using a star icon for visual context */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.avg_satisfaction_score ? data.avg_satisfaction_score.toFixed(1) : "N/A"}
            {data.avg_satisfaction_score && <span className="text-base font-normal text-muted-foreground">/5</span>}
          </div>
          <p className="text-xs text-muted-foreground">Based on lecturer feedback</p>
        </CardContent>
      </Card>
    </div>
  );
}