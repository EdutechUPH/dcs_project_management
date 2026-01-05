"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    FolderOpen,
    BarChart3,
    Settings,
    LogOut,
    PlusCircle,
    Users
} from "lucide-react"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "My Projects",
        href: "/my-projects",
        icon: FolderOpen,
    },
    {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
    },
    {
        title: "Team Workload",
        href: "/workload",
        icon: Users,
    },
    {
        title: "Admin",
        href: "/admin",
        icon: Settings,
    }
]

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="flex flex-col h-screen w-64 bg-gray-900 text-white border-r">
            <div className="p-6">
                <Link href="/">
                    <h1 className="text-xl font-bold tracking-wider hover:text-gray-300 transition-colors">DCS TRACKER</h1>
                </Link>
                <p className="text-xs text-gray-400 mt-1">Project Management v2.0</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-gray-800 text-white shadow-sm"
                                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                            )}
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {item.title}
                        </Link>
                    )
                })}

                <div className="pt-4 mt-4 border-t border-gray-800">
                    <Link
                        href="/projects/new"
                        className="flex items-center px-4 py-3 text-sm font-medium text-emerald-400 hover:bg-gray-800/50 hover:text-emerald-300 rounded-md transition-colors"
                    >
                        <PlusCircle className="w-5 h-5 mr-3" />
                        New Project
                    </Link>
                </div>
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
