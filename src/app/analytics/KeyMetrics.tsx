// src/app/analytics/KeyMetrics.tsx
"use client";

import { PlaySquare, Clock, Timer, Layers, Star } from "lucide-react";
import { type KeyMetricsData } from "@/lib/types";
import { StatTile } from "./ui";
import { SERIES, STATUS, compactNumber, formatMinutes } from "./chart-theme";

type KeyMetricsProps = { data: KeyMetricsData | null };

export default function KeyMetrics({ data }: KeyMetricsProps) {
  if (!data) return null;

  const totalMinutes =
    (data.total_duration_minutes || 0) + Math.floor((data.total_duration_seconds || 0) / 60);
  const avgLength =
    data.total_videos_completed > 0 ? totalMinutes / data.total_videos_completed : 0;

  const satisfaction = data.avg_satisfaction_score;
  const satisfactionTone =
    satisfaction == null ? "neutral" : satisfaction >= 4.5 ? "good" : satisfaction >= 3.5 ? "warning" : "critical";

  const cycle = data.median_cycle_days;

  // Accent colours give the five tiles distinct identities so the row can be scanned. Taken
  // from the categorical palette in slot order, matching the dashboard tiles; the satisfaction
  // tile accents on its own state because that is the one figure here that can be bad.
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatTile
        hero
        label="Videos delivered"
        value={compactNumber(data.total_videos_completed)}
        icon={<PlaySquare className="h-4 w-4" />}
        accent={SERIES[0]}
        hint={
          data.completion_sparkline.length > 1
            ? "Approved as done. Trend shows the last weeks of approvals."
            : "Approved as done by the lecturer."
        }
        sparkline={data.completion_sparkline}
      />

      <StatTile
        label="Runtime produced"
        value={formatMinutes(totalMinutes)}
        icon={<Clock className="h-4 w-4" />}
        accent={SERIES[2]}
        hint={
          data.total_videos_completed > 0
            ? `Averaging ${avgLength.toFixed(1)} min per finished video.`
            : "Combined runtime of all finished videos."
        }
      />

      <StatTile
        label="Median cycle time"
        value={cycle == null ? "—" : cycle.toFixed(0)}
        unit={cycle == null ? undefined : cycle === 1 ? "day" : "days"}
        icon={<Timer className="h-4 w-4" />}
        accent={SERIES[6]}
        hint={
          cycle == null
            ? "No video has both a logged date and a recorded approval yet."
            : `Logged in the tracker → lecturer approval, across ${data.cycle_sample} measurable ${data.cycle_sample === 1 ? "video" : "videos"}.`
        }
      />

      <StatTile
        label="In the pipeline"
        value={compactNumber(data.active_videos)}
        icon={<Layers className="h-4 w-4" />}
        accent={SERIES[1]}
        hint={`${data.videos_in_review ?? 0} of these ${(data.videos_in_review ?? 0) === 1 ? "is" : "are"} with the lecturer for review.`}
      />

      <StatTile
        label="Avg. satisfaction"
        value={satisfaction == null ? "—" : satisfaction.toFixed(1)}
        unit={satisfaction == null ? undefined : "/5"}
        tone={satisfactionTone}
        icon={<Star className="h-4 w-4" />}
        accent={
          satisfaction == null
            ? SERIES[3]
            : satisfactionTone === "good"
              ? STATUS.good
              : satisfactionTone === "warning"
                ? STATUS.warning
                : STATUS.critical
        }
        meter={satisfaction == null ? null : (satisfaction / 5) * 100}
        hint="Final-product rating from completed project feedback forms."
      />
    </div>
  );
}
