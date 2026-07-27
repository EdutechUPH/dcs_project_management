// src/app/analytics/SoundEngineerTable.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartCard, ShareBar } from "./ui";
import { INK, SERIES, formatMinutes } from "./chart-theme";

type SoundEngineerEntry = {
    engineerId: string;
    engineerName: string;
    completedVideos: number;
    activeVideos: number;
    minutesProduced: number;
};

type Props = {
    data: SoundEngineerEntry[];
};

export default function SoundEngineerTable({ data }: Props) {
    const sorted = [...data].sort((a, b) => b.minutesProduced - a.minutesProduced);
    const totalMinutes = sorted.reduce((sum, e) => sum + e.minutesProduced, 0);

    return (
        <ChartCard
            title="Sound engineer coverage"
            description="Completed videos and runtime credited to each sound engineer."
            titleNote="Sound engineers have no per-video assignment, so they are credited for every completed video in the projects they are assigned to."
            footnote="Because credit is project-wide, these minutes overlap with the editor scorecard rather than adding to it — the same video is counted for both roles."
            className="h-full"
        >
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs uppercase tracking-wide text-gray-500">Engineer</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500">Completed</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500">
                            In production
                        </TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500">
                            Runtime
                        </TableHead>
                        <TableHead className="w-[112px] text-xs uppercase tracking-wide text-gray-500">Share</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map(entry => {
                        const share = totalMinutes > 0 ? (entry.minutesProduced / totalMinutes) * 100 : 0;
                        return (
                            <TableRow key={entry.engineerId} className="border-gray-100">
                                <TableCell className="font-medium text-gray-900">{entry.engineerName}</TableCell>
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
                                        <ShareBar value={share} color={SERIES[2]} />
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
