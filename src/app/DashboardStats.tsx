import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertCircle, CheckCircle2, Film } from "lucide-react"

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
    overdueProjects
}: DashboardStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Ongoing Projects
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalActive}</div>
                    <p className="text-xs text-muted-foreground pt-1">
                        Currently in progress
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Videos WIP
                    </CardTitle>
                    <Film className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground pt-1">
                        Videos not yet &apos;Done&apos;
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Attention Needed
                    </CardTitle>
                    <AlertCircle className={`h-4 w-4 ${overdueProjects > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${overdueProjects > 0 ? "text-red-600" : ""}`}>{overdueProjects}</div>
                    <p className="text-xs text-muted-foreground pt-1">
                        Overdue projects
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Completed
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalCompleted}</div>
                    <p className="text-xs text-muted-foreground pt-1">
                        Projects finished
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
