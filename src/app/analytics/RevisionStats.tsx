// src/app/analytics/RevisionStats.tsx
"use client";

import { RotateCcw, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  totalRevisionRequests: number;
  videosWithRevision: number;
  revisionRate: number;
  totalCompleted: number;
};

export default function RevisionStats({ totalRevisionRequests, videosWithRevision, revisionRate, totalCompleted }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revision Rounds</CardTitle>
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRevisionRequests}</div>
          <p className="text-xs text-muted-foreground">
            Across {videosWithRevision} video{videosWithRevision !== 1 ? 's' : ''} that needed rework
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">First-Pass Approval Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCompleted > 0 ? `${100 - revisionRate}%` : "N/A"}</div>
          <p className="text-xs text-muted-foreground">
            Videos approved without revision ({totalCompleted - videosWithRevision} of {totalCompleted})
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
