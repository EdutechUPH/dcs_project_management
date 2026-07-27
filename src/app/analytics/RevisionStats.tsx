// src/app/analytics/RevisionStats.tsx
"use client";

import { RotateCcw, CheckCircle2, Repeat } from "lucide-react";
import { StatTile } from "./ui";
import { SERIES } from "./chart-theme";

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

  // Captions stay under five words; the method behind each figure sits in `note`
  // (AI_README §14). These three previously carried two-sentence captions — one of them a
  // pure definition rather than anything about the data — which turned a row of three
  // numbers into a paragraph.
  //
  // `accent` gives each tile an identity so the row is scannable, while `tone` stays free
  // to say whether the figure is good: on the first tile the chip is blue and the figure
  // green, which is the intended division of labour rather than an accident.
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatTile
        label="First-pass approval"
        value={firstPass == null ? "—" : `${firstPass.toFixed(0)}%`}
        tone={tone}
        icon={<CheckCircle2 className="h-4 w-4" />}
        accent={SERIES[0]}
        meter={firstPass}
        hint={
          totalCompleted > 0
            ? `${totalCompleted - videosWithRevision} of ${totalCompleted} approved first time`
            : "No finished videos in scope yet"
        }
        note={
          totalCompleted > 0
            ? "A video counts as first-pass when no revision was ever logged against it. Only finished videos are included — work still in production has not had the chance to come back."
            : undefined
        }
      />

      <StatTile
        label="Revision rounds"
        value={String(totalRevisionRequests)}
        icon={<RotateCcw className="h-4 w-4" />}
        accent={SERIES[1]}
        hint={`Across ${videosWithRevision} ${videosWithRevision === 1 ? "video" : "videos"}`}
        note={'Only feedback entries explicitly marked "Revision Requested" count. Approvals and ready-for-review entries share the same log and are excluded — counting all of them is what once reported 76 rounds instead of 14.'}
      />

      <StatTile
        label="Rounds per revised video"
        value={roundsPerRevised == null ? "—" : roundsPerRevised.toFixed(1)}
        icon={<Repeat className="h-4 w-4" />}
        accent={SERIES[6]}
        hint={
          roundsPerRevised == null
            ? "Nothing has needed a revision"
            : `Among the ${videosWithRevision} revised ${videosWithRevision === 1 ? "video" : "videos"}`
        }
        note={
          roundsPerRevised == null
            ? undefined
            : "How many times a video comes back once it comes back at all — the cost of a miss, kept separate from how often one happens. Videos approved first time are excluded, so this never dilutes towards 1.0."
        }
      />
    </div>
  );
}
