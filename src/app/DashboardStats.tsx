// src/app/DashboardStats.tsx
import { Activity, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { StatTile } from "@/components/insight/primitives";
import { SERIES, STATUS } from "@/components/insight/tokens";

interface DashboardStatsProps {
    totalActive: number;
    totalCompleted: number;
    videosInProduction: number;
    overdueProjects: number;
    overdueVideos: number;
    videosDelivered: number;
    /** Live work whose term has already passed — behind the term it was meant for. */
    behindProjects: number;
    behindVideos: number;
    /** Which year that work is for, e.g. '2025/2026'. Null when there is none. */
    behindFromYear: string | null;
    /** Set when an academic year is scoping these figures; null when showing all time. */
    activeYearName: string | null;
}

/** "1 project" / "6 projects" — the noun under a figure has to agree with it. */
const plural = (n: number, word: string) => `${word}${n === 1 ? "" : "s"}`;

export function DashboardStats({
    totalActive,
    totalCompleted,
    videosInProduction,
    overdueProjects,
    overdueVideos,
    videosDelivered,
    behindProjects,
    behindVideos,
    behindFromYear,
    activeYearName,
}: DashboardStatsProps) {
    const tracked = totalActive + totalCompleted;
    const completionRate = tracked > 0 ? Math.round((totalCompleted / tracked) * 100) : null;
    const scoped = activeYearName != null;

    // Each state counted in both units the team works in. The row used to be four tiles
    // where "Ongoing projects: 6" and "Videos in production: 105" were the same fact split
    // across two cards — the hint under the first already said "105 videos still to
    // deliver". Pairing them removed the duplicate and made room for two figures the row
    // could not previously answer at all: videos delivered, and the carry-over debt.
    //
    // Ongoing and Behind are disjoint and add back up to every live project, so the reader
    // is never double-counting. Overdue deliberately spans both — a late project is late
    // whichever term it was for.
    //
    // Work recorded AHEAD of its term is not split out. A course for 1262 taped during
    // 1252 is ordinary production, just early, so it sits in Ongoing with a quiet pill on
    // its row. Only the backwards case earns a number of its own, because only that one
    // represents something slipping.
    //
    // Each tile's colour lives in the tinted chip behind its icon, so it is identifiable at
    // a glance without a band of colour stretched across the card. Colour still carries
    // meaning where it can: Overdue is red only while there is something to chase, and
    // Behind is amber only while something is behind.
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
                label="Ongoing"
                value={totalActive.toLocaleString()}
                valueLabel={plural(totalActive, "project")}
                secondary={{
                    value: videosInProduction.toLocaleString(),
                    label: `${plural(videosInProduction, "video")} to deliver`,
                }}
                icon={<Activity className="h-4 w-4" />}
                accent={SERIES[0]}
                hint={
                    scoped
                        ? `Live work for ${activeYearName} and for terms still to come`
                        : "Not yet marked Done, in projects that are still live"
                }
            />
            <StatTile
                label="Behind their term"
                value={behindProjects.toLocaleString()}
                valueLabel={plural(behindProjects, "project")}
                secondary={{
                    value: behindVideos.toLocaleString(),
                    label: `${plural(behindVideos, "video")} outstanding`,
                }}
                icon={<RotateCcw className="h-4 w-4" />}
                accent={behindProjects > 0 ? STATUS.warning : STATUS.good}
                tone={behindProjects > 0 ? "warning" : "good"}
                hint={
                    behindProjects > 0
                        ? `Still in production for ${behindFromYear ?? "an earlier year"}, whose terms have already run. Counted here, not hidden — they are live work with real deadlines.`
                        : "Nothing is still running for a term that has passed"
                }
            />
            <StatTile
                label="Overdue"
                value={overdueProjects.toLocaleString()}
                valueLabel={plural(overdueProjects, "project")}
                secondary={{
                    value: overdueVideos.toLocaleString(),
                    label: `${plural(overdueVideos, "video")} outstanding`,
                }}
                icon={<AlertCircle className="h-4 w-4" />}
                accent={overdueProjects > 0 ? STATUS.critical : STATUS.good}
                tone={overdueProjects > 0 ? "critical" : "good"}
                hint={
                    overdueProjects > 0
                        ? "Past the agreed due date and unfinished, whichever term it is for"
                        : "Everything live is inside its deadline"
                }
            />
            <StatTile
                label={scoped ? "Completed this year" : "Completed"}
                value={totalCompleted.toLocaleString()}
                valueLabel={plural(totalCompleted, "project")}
                secondary={{
                    value: videosDelivered.toLocaleString(),
                    label: `${plural(videosDelivered, "video")} delivered`,
                }}
                icon={<CheckCircle2 className="h-4 w-4" />}
                accent={STATUS.good}
                meter={completionRate}
                tone="good"
                hint={
                    completionRate != null
                        ? `${completionRate}% of the ${tracked.toLocaleString()} projects tracked here. Videos delivered counts every finished video, including those in projects still running.`
                        : "Nothing completed yet in this year"
                }
            />
        </div>
    );
}
