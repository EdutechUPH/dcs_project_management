"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Project } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

export const columns: ColumnDef<Project>[] = [
    {
        accessorKey: "course_name",
        header: "Project / Course",
        cell: ({ row }) => {
            const project = row.original
            return (
                <div>
                    <div className="font-medium text-gray-900">{project.course_name}</div>
                    <div className="text-sm text-gray-500">{project.lecturers?.name}</div>
                </div>
            )
        },
    },
    {
        id: "study_program",
        accessorFn: (row) => row.prodi?.name,
        header: "Study Program",
    },
    {
        id: "main_editor",
        header: "Main Editor/Videographer",
        cell: ({ row }) => {
            const project = row.original
            const mainTeam = project.project_assignments.filter((a) => a.role === 'Main Editor / Videographer')
            const mainTeamNames = mainTeam
                .map((a) => a.profiles?.full_name)
                .filter(Boolean)
                .join(', ')

            return <div className="text-gray-500">{mainTeamNames || 'Unassigned'}</div>
        },
    },
    {
        id: "progress",
        header: "Progress",
        cell: ({ row }) => {
            const project = row.original
            const totalCount = project.videos.length
            const doneCount = project.videos.filter((v) => v.status === 'Done').length
            const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

            return (
                <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{doneCount}/{totalCount}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ row }) => {
            const date = row.getValue("due_date") as string
            const project = row.original

            // Calculate progress again for overdue check
            const totalCount = project.videos.length
            const doneCount = project.videos.filter((v) => v.status === 'Done').length
            const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

            const isOverdue = date && new Date(date) < new Date() && progress < 100

            return (
                <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatDate(date)}
                    {isOverdue && <div className="text-xs text-red-500">OVERDUE</div>}
                </div>
            )
        },
    },
    // Add Actions column for managing the project
    {
        id: "actions",
        cell: ({ row }) => {
            const project = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}`}>
                                Edit Project
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
