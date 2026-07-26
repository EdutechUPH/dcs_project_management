// src/app/DashboardStats.tsx
import { Activity, AlertCircle, CheckCircle2, Film } from "lucide-react";
import { StatTile } from "@/components/insight/primitives";
import { SERIES, STATUS } from "@/components/insight/tokens";

interface DashboardStatsProps {
    totalActive: number;
    totalCompleted: number;
    videosInProduction: number;
    overdueProjects: number;
}

export function DashboardStats({
    totalActive,
    totalCompleted,
    videosInProduction,
    overdueProjects,
}: DashboardStatsProps) {
    const tracked = totalActive + totalCompleted;
    const completionRate = tracked > 0 ? Math.round((totalCompleted / tracked) * 100) : null;

    // The tiles used to be four different gradients, which spent colour on decoration. They
    // then went fully plain, which made the row hard to scan. This is the middle: each tile
    // gets an accent rule and a tinted icon so it is identifiable at a glance, while colour
    // still carries meaning where it can — "Overdue" is the one tile that CHANGES with state,
    // red while there is something to chase and green once there isn't.
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatTile
                label="Ongoing projects"
                value={totalActive.toLocaleString()}
                icon={<Activity className="h-4 w-4" />}
                accent={SERIES[0]}
                hint={
                    videosInProduction > 0
                        ? `${videosInProduction.toLocaleString()} videos still to deliver`
                        : "No videos left to deliver"
                }
            />
            <StatTile
                label="Videos in production"
                value={videosInProduction.toLocaleString()}
                icon={<Film className="h-4 w-4" />}
                accent={SERIES[6]}
                hint="Not yet marked Done, in projects that are still live"
            />
            <StatTile
                label="Overdue"
                value={overdueProjects.toLocaleString()}
                icon={<AlertCircle className="h-4 w-4" />}
                accent={overdueProjects > 0 ? STATUS.critical : STATUS.good}
                tone={overdueProjects > 0 ? "critical" : "good"}
                hint={
                    overdueProjects > 0
                        ? "Past the due date and unfinished"
                        : "Everything live is inside its deadline"
                }
            />
            <StatTile
                label="Completed"
                value={totalCompleted.toLocaleString()}
                icon={<CheckCircle2 className="h-4 w-4" />}
                accent={STATUS.good}
                meter={completionRate}
                tone="good"
                hint={
                    completionRate != null
                        ? `${completionRate}% of the ${tracked.toLocaleString()} projects tracked here`
                        : "No projects tracked yet"
                }
            />
        </div>
    );
}
