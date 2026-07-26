// src/app/analytics/RevisionStats.tsx
"use client";

import { RotateCcw, CheckCircle2, Repeat } from "lucide-react";
import { StatTile } from "./ui";

type Props = {
  totalRevisionRequests: number;
  videosWithRevision: number;
  revisionRate: number;
  totalCompleted: number;
};

export default function RevisionStats({
  totalRevisionRequests,
  videosWithRevision,
  revisionRate,
  totalCompleted,
}: Props) {
  const firstPass = totalCompleted > 0 ? 100 - revisionRate : null;
  const roundsPerRevised =
    videosWithRevision > 0 ? totalRevisionRequests / videosWithRevision : null;

  const tone = firstPass == null ? "neutral" : firstPass >= 90 ? "good" : firstPass >= 75 ? "warning" : "critical";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatTile
        label="First-pass approval"
        value={firstPass == null ? "—" : `${firstPass.toFixed(0)}%`}
        tone={tone}
        icon={<CheckCircle2 className="h-4 w-4" />}
        meter={firstPass}
        hint={
          totalCompleted > 0
            ? `${totalCompleted - videosWithRevision} of ${totalCompleted} finished videos were approved without a single revision round.`
            : "No finished videos in scope yet."
        }
      />

      <StatTile
        label="Revision rounds"
        value={String(totalRevisionRequests)}
        icon={<RotateCcw className="h-4 w-4" />}
        hint={`Logged across ${videosWithRevision} ${videosWithRevision === 1 ? "video that needed" : "videos that needed"} rework. Only entries explicitly marked "Revision Requested" count.`}
      />

      <StatTile
        label="Rounds per revised video"
        value={roundsPerRevised == null ? "—" : roundsPerRevised.toFixed(1)}
        icon={<Repeat className="h-4 w-4" />}
        hint={
          roundsPerRevised == null
            ? "Nothing in scope has needed a revision."
            : "How many times a video comes back once it comes back at all — the cost of a miss, separate from how often one happens."
        }
      />
    </div>
  );
}
