// src/app/analytics/OnTimeDeliveryTable.tsx
"use client";

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarClock } from "lucide-react";
import { ChartCard, EmptyState } from "./ui";
import { STATUS } from "./chart-theme";

export type OnTimeEntry = {
    editorId: string;
    editorName: string;
    /** Delivered videos that have a delivery date AND a deadline to compare against. */
    measured: number;
    onTime: number;
    late: number;
    /** Delivered, but no delivery date recorded or no deadline set — excluded from the rate. */
    untracked: number;
};

type Props = {
    data: OnTimeEntry[];
    /** Deadline changes recorded across the projects currently in scope. */
    deadlineChanges: number;
};

const rateOf = (onTime: number, late: number): number | null => {
    const measured = onTime + late;
    return measured > 0 ? Math.round((onTime / measured) * 100) : null;
};

const rateTone = (value: number) => {
    if (value >= 90) return { color: "#0a7d0a", background: "#e9f7e9" };
    if (value >= 70) return { color: "#8a5a00", background: "#fdf3dd" };
    return { color: "#b32f2f", background: "#fdeeee" };
};

export default function OnTimeDeliveryTable({ data, deadlineChanges }: Props) {
    const totals = data.reduce(
        (acc, e) => ({
            measured: acc.measured + e.measured,
            onTime: acc.onTime + e.onTime,
            late: acc.late + e.late,
            untracked: acc.untracked + e.untracked,
        }),
        { measured: 0, onTime: 0, late: 0, untracked: 0 }
    );

    // Nothing has a recorded delivery date yet. Say so plainly rather than
    // rendering a table of zeroes that reads like a punctuality failure.
    if (totals.measured === 0) {
        return (
            <ChartCard
                title="On-time delivery"
                description="Delivery punctuality per main editor, measured from hand-off to the lecturer."
            >
                <EmptyState
                    icon={<CalendarClock className="h-8 w-8" />}
                    title="Punctuality tracking has just started"
                >
                    Delivery dates are recorded from the moment a video is handed to the lecturer for review. Work
                    delivered before this tracking was added has no recorded delivery date, so there is nothing to
                    measure yet — this table fills in as the team moves videos into Review from now on.
                    {totals.untracked > 0 && (
                        <p className="mt-3 text-xs text-gray-400">
                            {totals.untracked} delivered {totals.untracked === 1 ? "video" : "videos"} in scope predate
                            tracking.
                        </p>
                    )}
                </EmptyState>
            </ChartCard>
        );
    }

    const sorted = [...data]
        .filter(e => e.measured > 0 || e.untracked > 0)
        .sort((a, b) => {
            const rateA = rateOf(a.onTime, a.late) ?? -1;
            const rateB = rateOf(b.onTime, b.late) ?? -1;
            return rateB - rateA || b.measured - a.measured;
        });

    const teamRate = rateOf(totals.onTime, totals.late);

    return (
        <ChartCard
            title="On-time delivery"
            description="Per-video punctuality, credited to the video's main editor."
            titleNote="A video is on time if it reached the lecturer on or before its deadline — the video's own due date where one is set, otherwise the project's. Delivery means the first hand-off; later revision rounds do not reset it."
            aside={
                teamRate !== null ? (
                    <div className="text-right">
                        <p
                            className="text-2xl font-semibold leading-none tracking-tight"
                            style={{ color: rateTone(teamRate).color }}
                        >
                            {teamRate}%
                        </p>
                        <p className="mt-1 text-xs text-gray-500">team on-time rate</p>
                    </div>
                ) : undefined
            }
            coverage={
                totals.untracked > 0
                    ? {
                        label: `${totals.untracked} not tracked`,
                        note: "Delivered videos with no recorded delivery date (handed over before tracking started) or no deadline set. They are excluded from the rate rather than assumed on time — the reason this table shows a rate at all rather than a misleading 11%.",
                        tone: "warning",
                    }
                    : undefined
            }
            // Deadline changes survive as a footnote because they are neither visible in the
            // table nor an exclusion: they are the reason a rate can look good while dates
            // moved, and the rule that makes that legitimate is in titleNote.
            footnote={
                deadlineChanges > 0
                    ? `${deadlineChanges} ${deadlineChanges === 1 ? "deadline was" : "deadlines were"} moved after the project was created. Punctuality is measured against the most recent one, so a lecturer-requested reschedule stays visible without counting as team lateness.`
                    : undefined
            }
        >
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs uppercase tracking-wide text-gray-500">Editor</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500">
                            Measured
                        </TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500">
                            On time
                        </TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500">Late</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500">
                            Not tracked
                        </TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500">Rate</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map(entry => {
                        const entryRate = rateOf(entry.onTime, entry.late);
                        return (
                            <TableRow key={entry.editorId} className="border-gray-100">
                                <TableCell className="font-medium text-gray-900">{entry.editorName}</TableCell>
                                <TableCell className="text-right text-sm tabular-nums text-gray-600">
                                    {entry.measured}
                                </TableCell>
                                <TableCell
                                    className="text-right text-sm font-semibold tabular-nums"
                                    style={{ color: STATUS.good }}
                                >
                                    {entry.onTime}
                                </TableCell>
                                <TableCell className="text-right text-sm font-semibold tabular-nums" style={{ color: "#b32f2f" }}>
                                    {entry.late}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums text-gray-400">
                                    {entry.untracked || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                    {entryRate === null ? (
                                        <span className="text-xs text-gray-400">n/a</span>
                                    ) : (
                                        <span
                                            className="inline-block rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
                                            style={rateTone(entryRate)}
                                        >
                                            {entryRate}%
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
                <TableFooter className="bg-gray-50/70">
                    <TableRow className="hover:bg-transparent">
                        <TableCell className="font-semibold text-gray-900">Team total</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-gray-700">
                            {totals.measured}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-gray-700">{totals.onTime}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-gray-700">{totals.late}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-gray-400">
                            {totals.untracked || "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums text-gray-900">
                            {teamRate === null ? "n/a" : `${teamRate}%`}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </ChartCard>
    );
}
