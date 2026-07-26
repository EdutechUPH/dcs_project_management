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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { INK, SERIES, STATUS } from "@/components/insight/tokens"

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    // If it's a full ISO string (has T or :), parse directly. Otherwise assume YYYY-MM-DD and append time for local midnight.
    const date = (dateString.includes('T') || dateString.includes(':'))
        ? new Date(dateString)
        : new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

const daysBetween = (from: Date, to: Date) =>
    Math.round((to.getTime() - from.getTime()) / 86_400_000);

/**
 * One colour per status, covering the whole project_status enum.
 *
 * The previous version was `status === 'Done' ? green : blue`, which painted Pending and
 * Cancelled in the same "active" blue as work in flight — the label said one thing and the
 * colour said another. Anything unrecognised falls through to grey rather than to blue, so a
 * new enum value can never masquerade as in-progress.
 */
const STATUS_STYLES: Record<string, { color: string; background: string }> = {
    // 'Active' is what live project rows actually carry — it is not in the project_status enum
    // documented in AI_README §4, but it is the most common value in the table, so it must not
    // fall through to the neutral grey.
    'Active': { color: '#1c5cab', background: '#e8f1fc' },
    'Done': { color: '#0a7d0a', background: '#e9f7e9' },
    'Review': { color: '#8a5a00', background: '#fdf3dd' },
    'Video Editing': { color: '#1c5cab', background: '#e8f1fc' },
    'Audio Editing': { color: '#1c5cab', background: '#e8f1fc' },
    'Scheduled for Taping': { color: '#4a3aa7', background: '#eceafa' },
    'Requested': { color: '#52514e', background: '#f1f0ec' },
    'Pending': { color: '#8a5a00', background: '#faf1e2' },
    'Cancelled': { color: '#6b6a66', background: '#eeedea' },
};

const NEUTRAL_STATUS = { color: INK.secondary, background: INK.track };

export const columns: ColumnDef<Project>[] = [
    {
        accessorKey: "course_name",
        header: "Project / Course",
        cell: ({ row }) => {
            const project = row.original
            return (
                <div className="min-w-0">
                    {/* The row click expands; this link opens the project. Without stopPropagation
                        a click would do both, expanding a row you are navigating away from. */}
                    <Link
                        href={`/projects/${project.id}`}
                        onClick={e => e.stopPropagation()}
                        className="font-medium text-gray-900 underline-offset-2 hover:text-blue-700 hover:underline"
                    >
                        {project.course_name}
                    </Link>
                    <div className="truncate text-sm text-gray-500">{project.lecturers?.name}</div>
                </div>
            )
        },
    },
    {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.status || 'Active';
            const style = STATUS_STYLES[status] ?? NEUTRAL_STATUS;
            return (
                <span
                    className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ color: style.color, background: style.background }}
                >
                    {status}
                </span>
            )
        }
    },
    {
        accessorKey: "created_at",
        header: "Requested",
        cell: ({ row }) => {
            return <div className="whitespace-nowrap text-sm text-gray-500">{formatDate(row.getValue("created_at"))}</div>
        },
    },
    {
        id: "study_program",
        accessorFn: (row) => row.prodi?.name,
        header: "Study Program",
        cell: ({ row }) => (
            <div className="max-w-[200px] truncate text-sm text-gray-600">{row.original.prodi?.name ?? '—'}</div>
        ),
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

            if (!mainTeamNames) {
                return <span className="text-sm italic text-gray-400">Unassigned</span>
            }
            return <div className="max-w-[180px] truncate text-sm text-gray-600">{mainTeamNames}</div>
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
            const complete = totalCount > 0 && doneCount === totalCount

            return (
                <div className="flex items-center gap-2">
                    <div
                        className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full"
                        style={{ background: INK.track }}
                        role="presentation"
                    >
                        <div
                            className="h-full rounded-full transition-[width]"
                            style={{
                                width: `${progress}%`,
                                background: complete ? STATUS.good : SERIES[0],
                            }}
                        />
                    </div>
                    <span className="whitespace-nowrap text-xs font-medium tabular-nums text-gray-600">
                        {doneCount}/{totalCount}
                    </span>
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

            const totalCount = project.videos.length
            const doneCount = project.videos.filter((v) => v.status === 'Done').length
            const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

            const due = date
                ? (date.includes('T') || date.includes(':') ? new Date(date) : new Date(`${date}T00:00:00`))
                : null
            const isOverdue = due != null && due < new Date() && progress < 100
            const daysLate = isOverdue && due ? daysBetween(due, new Date()) : 0

            return (
                <div className="whitespace-nowrap">
                    <div className={`text-sm font-medium ${isOverdue ? 'text-[#b32f2f]' : 'text-gray-600'}`}>
                        {formatDate(date)}
                    </div>
                    {/* "OVERDUE" in caps shouted the same volume however late it was. The number of
                        days is both quieter and more useful for deciding what to chase first. */}
                    {isOverdue && (
                        <div className="text-xs text-[#b32f2f]">
                            {daysLate} {daysLate === 1 ? 'day' : 'days'} late
                        </div>
                    )}
                </div>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const project = row.original

            if (!project.id) {
                console.error("Project ID missing in actions column:", project);
                return <span className="text-xs text-red-500">Error</span>;
            }

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}`}>
                                Open project
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
