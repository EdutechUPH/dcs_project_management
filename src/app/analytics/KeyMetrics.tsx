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
        label="Videos completed"
        value={compactNumber(data.total_videos_completed)}
        icon={<PlaySquare className="h-4 w-4" />}
        accent={SERIES[0]}
        hint={data.completion_sparkline.length > 1 ? "Trend: recent weeks" : "Approved as done"}
        note="Videos the lecturer has approved. The sparkline plots approvals per week, so a video with no approval logged is absent from both."
        sparkline={data.completion_sparkline}
      />

      <StatTile
        label="Runtime produced"
        value={formatMinutes(totalMinutes)}
        icon={<Clock className="h-4 w-4" />}
        accent={SERIES[2]}
        hint={
          data.total_videos_completed > 0
            ? `${avgLength.toFixed(1)} min per video`
            : "No finished videos yet"
        }
        note="Combined runtime of every finished video in scope. Translation work adds nothing here — it re-uses an existing recording rather than producing new runtime."
      />

      <StatTile
        label="Median cycle time"
        value={cycle == null ? "—" : cycle.toFixed(0)}
        unit={cycle == null ? undefined : cycle === 1 ? "day" : "days"}
        icon={<Timer className="h-4 w-4" />}
        accent={SERIES[6]}
        hint={
          cycle == null
            ? "Not measurable yet"
            : `Across ${data.cycle_sample} measurable ${data.cycle_sample === 1 ? "video" : "videos"}`
        }
        note="Days from a video being logged in the tracker to the lecturer approving it. Median rather than mean, so a few very old rows cannot drag it somewhere no real video has been. Videos missing either end are excluded rather than estimated."
      />

      <StatTile
        label="In production"
        value={compactNumber(data.active_videos)}
        icon={<Layers className="h-4 w-4" />}
        accent={SERIES[1]}
        hint={`${data.videos_in_review ?? 0} in review`}
        note="Videos still in production, in projects that are neither Pending nor Cancelled. Videos in review with a lecturer are counted here too — they remain open work until approved."
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
        hint="Out of 5"
        note="The final-product rating from the feedback form, which a lecturer submits once per finished project. It is project-level, so it cannot be broken down per video."
      />
    </div>
  );
}
