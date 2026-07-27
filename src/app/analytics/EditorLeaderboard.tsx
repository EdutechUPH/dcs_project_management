// src/app/analytics/EditorLeaderboard.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartCard, EmptyState, ShareBar } from "./ui";
import { INK, SERIES, formatMinutes } from "./chart-theme";
import { UserRound } from "lucide-react";

type LeaderboardEntry = {
    editorId: string;
    editorName: string;
    completedVideos: number;
    activeVideos: number;
    minutesProduced: number;
};

type LeaderboardProps = {
    data: LeaderboardEntry[];
};

export default function EditorLeaderboard({ data }: LeaderboardProps) {
    const sorted = [...data].sort(
        (a, b) => b.completedVideos - a.completedVideos || b.minutesProduced - a.minutesProduced
    );

    const totalMinutes = sorted.reduce((sum, e) => sum + e.minutesProduced, 0);

    if (sorted.length === 0) {
        return (
            <ChartCard title="Editor scorecard" description="Per-video credit, from videos.main_editor_id.">
                <EmptyState icon={<UserRound className="h-8 w-8" />} title="No editor has been credited yet">
                    Videos are credited once a main editor is set on them.
                </EmptyState>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title="Editor scorecard"
            description="Videos and finished runtime credited to each editor."
            // Column definitions moved into titleNote rather than repeated under a table
            // whose headers already name them.
            titleNote="Credit follows the main editor set on each individual video, not the project assignment — so a per-video override moves the credit with it. Share is the editor’s portion of all completed runtime in scope; In production counts videos not yet completed, in projects that are neither Pending nor Cancelled."
        >
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[44px] text-xs uppercase tracking-wide text-gray-500">#</TableHead>
                        <TableHead className="text-xs uppercase tracking-wide text-gray-500">Editor</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500">Completed</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500">
                            In production
                        </TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500">
                            Runtime
                        </TableHead>
                        <TableHead className="w-[132px] text-xs uppercase tracking-wide text-gray-500">Share</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map((entry, index) => {
                        const share = totalMinutes > 0 ? (entry.minutesProduced / totalMinutes) * 100 : 0;
                        const avgLength =
                            entry.completedVideos > 0 ? entry.minutesProduced / entry.completedVideos : 0;
                        return (
                            <TableRow key={entry.editorId} className="border-gray-100">
                                <TableCell className="text-sm font-medium tabular-nums text-gray-400">
                                    {index + 1}
                                </TableCell>
                                <TableCell>
                                    <span className="block font-medium text-gray-900">{entry.editorName}</span>
                                    {entry.completedVideos > 0 && (
                                        <span className="text-xs text-gray-500">
                                            {avgLength.toFixed(1)} min avg per video
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-sm font-semibold tabular-nums text-gray-900">
                                    {entry.completedVideos}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums text-gray-600">
                                    {entry.activeVideos || <span className="text-gray-300">—</span>}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums text-gray-900">
                                    {formatMinutes(entry.minutesProduced)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <ShareBar value={share} color={SERIES[0]} />
                                        <span
                                            className="w-9 shrink-0 text-right text-xs tabular-nums"
                                            style={{ color: INK.secondary }}
                                        >
                                            {share.toFixed(0)}%
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </ChartCard>
    );
}
