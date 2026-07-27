// src/app/DashboardStats.tsx
import { Activity, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { StatTile } from "@/components/insight/primitives";
import { INK, SERIES, STATUS } from "@/components/insight/tokens";

interface DashboardStatsProps {
    totalActive: number;
    totalCompleted: number;
    videosInProduction: number;
    overdueProjects: number;
    overdueVideos: number;
    videosCompleted: number;
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
    videosCompleted,
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
    // could not previously answer at all: videos completed, and the carry-over debt.
    //
    // Ongoing and Behind are disjoint and add back up to every ongoing project, so the reader
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
                    label: `${plural(videosInProduction, "video")} in production`,
                }}
                icon={<Activity className="h-4 w-4" />}
                accent={SERIES[0]}
                note={
                    scoped
                        ? `Ongoing work for ${activeYearName}, plus anything already started for terms still to come.`
                        : "Ongoing projects, with their videos still in production."
                }
            />
            <StatTile
                label="Behind their term"
                value={behindProjects.toLocaleString()}
                valueLabel={plural(behindProjects, "project")}
                secondary={{
                    value: behindVideos.toLocaleString(),
                    label: `${plural(behindVideos, "video")} in production`,
                }}
                icon={<RotateCcw className="h-4 w-4" />}
                // Amber while there is something behind; grey when there is not — never
                // green. Green is Completed's colour, and a second green chip on the row
                // made a card about slippage look like a second achievement. Grey reads as
                // "nothing here", which is what a zero means; the caption says so in words,
                // so the state never rests on colour alone (AI_README §12).
                accent={behindProjects > 0 ? STATUS.warning : INK.muted}
                tone={behindProjects > 0 ? "warning" : "neutral"}
                hint={
                    behindProjects > 0
                        ? `From ${behindFromYear ?? "an earlier year"}`
                        : "Nothing past its term"
                }
                note={
                    behindProjects > 0
                        ? `Still in production for ${behindFromYear ?? "an earlier year"}, whose terms have already run. Counted here rather than hidden — this is ongoing work with real deadlines.`
                        : undefined
                }
            />
            <StatTile
                label="Overdue"
                value={overdueProjects.toLocaleString()}
                valueLabel={plural(overdueProjects, "project")}
                secondary={{
                    value: overdueVideos.toLocaleString(),
                    label: `${plural(overdueVideos, "video")} in production`,
                }}
                icon={<AlertCircle className="h-4 w-4" />}
                // Same rule as Behind, for the same reason — otherwise a quiet week puts
                // three green chips in a row and the one that means "finished" stops
                // standing out.
                accent={overdueProjects > 0 ? STATUS.critical : INK.muted}
                tone={overdueProjects > 0 ? "critical" : "neutral"}
                hint={overdueProjects === 0 ? "All inside their deadlines" : undefined}
                note={
                    overdueProjects > 0
                        ? "Ongoing projects past their due date with videos still in production, whichever term they are for. The date is the latest agreed one, so a lecturer-requested reschedule does not count as lateness."
                        : undefined
                }
            />
            <StatTile
                label={scoped ? "Completed this year" : "Completed"}
                value={totalCompleted.toLocaleString()}
                valueLabel={plural(totalCompleted, "project")}
                secondary={{
                    value: videosCompleted.toLocaleString(),
                    label: `${plural(videosCompleted, "video")} completed`,
                }}
                icon={<CheckCircle2 className="h-4 w-4" />}
                accent={STATUS.good}
                meter={completionRate}
                tone="good"
                hint={completionRate == null ? "Nothing completed yet" : undefined}
                // Beside the bar rather than under it. This is the tallest tile in the row,
                // so it is the only one where removing a line makes the row shorter.
                meterLabel={
                    completionRate != null
                        ? `${completionRate}% of ${tracked.toLocaleString()}`
                        : undefined
                }
                note={
                    completionRate != null
                        ? `${totalCompleted} of the ${tracked} projects tracked here are complete. The video count includes every completed video, including those inside projects still running — so it will usually exceed the videos in the completed projects alone. "Completed" means the lecturer approved it, which is not the same as "delivered": a video is delivered the moment it first reaches the lecturer, and may sit in review for weeks afterwards.`
                        : undefined
                }
            />
        </div>
    );
}
