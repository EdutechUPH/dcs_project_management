"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
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

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                setRole(data?.role || null);
            }
        };
        fetchRole();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const [role, setRole] = require('react').useState<string | null>(null);

    require('react').useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                setRole(data?.role || null);
            }
        };
        fetchRole();
    }, [supabase]);

    return (
        <div className={cn(
            "flex-col h-screen w-64 bg-gray-900 text-white border-r flex",
            mobile ? "w-full border-none" : "hidden md:flex"
        )}>
            <div className="p-6">
                <Link href="/">
                    <h1 className="text-xl font-bold tracking-wider hover:text-gray-300 transition-colors">DCS TRACKER</h1>
                </Link>
                <p className="text-xs text-gray-400 mt-1">Project Management v2.0</p>
                {role && <span className="text-[10px] uppercase text-gray-500 bg-gray-800 px-2 py-0.5 rounded mt-2 inline-block">{role}</span>}
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    // Hide Admin tab entirely if Pending (though middleware blocks it too)
                    // Actually, everyone approved can see Admin now.

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

                {/* Only Admin and ID can create new projects */}
                {role !== 'Digital Content Specialist' && (
                    <div className="pt-4 mt-4 border-t border-gray-800">
                        <Link
                            href="/projects/new"
                            className="flex items-center px-4 py-3 text-sm font-medium text-emerald-400 hover:bg-gray-800/50 hover:text-emerald-300 rounded-md transition-colors"
                        >
                            <PlusCircle className="w-5 h-5 mr-3" />
                            New Project
                        </Link>
                    </div>
                )}
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
