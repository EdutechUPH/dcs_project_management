// src/app/analytics/KeyMetrics.tsx
"use client";

import { PlaySquare, Clock, Video, Film } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KeyMetricsProps = {
  data: {
    total_videos_completed: number;
    total_duration_minutes: number;
    total_duration_seconds: number;
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
            Projects reached "Done" status
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

      {/* Placeholders for future metrics */}
      {/* 
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium">Active Production</CardTitle>
           <Video className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
           <div className="text-2xl font-bold">--</div>
           <p className="text-xs text-muted-foreground">Current Workload</p>
        </CardContent>
      </Card>
      */}
    </div>
  );
}