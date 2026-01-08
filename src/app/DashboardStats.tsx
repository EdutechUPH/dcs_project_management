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
            <Card className="bg-gradient-to-br from-blue-500/10 via-white/50 to-indigo-500/10 backdrop-blur-md border-blue-500/20 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700">
                        Ongoing Projects
                    </CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-800">{totalActive}</div>
                    <p className="text-xs text-muted-foreground pt-1">
                        Currently in progress
                    </p>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 via-white/50 to-pink-500/10 backdrop-blur-md border-purple-500/20 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700">
                        Videos WIP
                    </CardTitle>
                    <Film className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-800">{videosInProduction}</div>
                    <p className="text-xs text-muted-foreground pt-1">
                        Videos not yet &apos;Done&apos;
                    </p>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500/10 via-white/50 to-orange-500/10 backdrop-blur-md border-red-500/20 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-700">
                        Attention Needed
                    </CardTitle>
                    <AlertCircle className={`h-4 w-4 ${overdueProjects > 0 ? "text-red-600" : "text-red-400"}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${overdueProjects > 0 ? "text-red-700" : "text-gray-800"}`}>{overdueProjects}</div>
                    <p className="text-xs text-muted-foreground pt-1">
                        Overdue projects
                    </p>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 via-white/50 to-emerald-500/10 backdrop-blur-md border-green-500/20 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-700">
                        Completed
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-800">{totalCompleted}</div>
                    <p className="text-xs text-muted-foreground pt-1">
                        Projects finished
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
