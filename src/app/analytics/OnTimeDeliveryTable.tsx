// src/app/analytics/OnTimeDeliveryTable.tsx
"use client";

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock } from "lucide-react";

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

const rateClasses = (value: number) => {
    if (value >= 90) return "bg-green-50 text-green-700 border-green-200";
    if (value >= 70) return "bg-yellow-50 text-yellow-900 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
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
            <Card>
                <CardHeader>
                    <CardTitle>On-Time Video Delivery</CardTitle>
                    <CardDescription>
                        Delivery punctuality per main editor, measured from hand-off to the lecturer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center text-center py-10 px-6 border border-dashed rounded-lg bg-gray-50">
                        <CalendarClock className="h-8 w-8 text-gray-400 mb-3" />
                        <p className="font-medium text-gray-700">Punctuality tracking has just started</p>
                        <p className="text-sm text-gray-500 mt-2 max-w-xl">
                            Delivery dates are recorded from the moment a video is handed to the lecturer for
                            review. Work delivered before this tracking was added has no recorded delivery date,
                            so there is nothing to measure yet — this table fills in as the team moves videos
                            into Review from now on.
                        </p>
                        {totals.untracked > 0 && (
                            <p className="text-xs text-gray-400 mt-3">
                                {totals.untracked} delivered {totals.untracked === 1 ? "video" : "videos"} in
                                scope predate tracking.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
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
        <Card>
            <CardHeader>
                <CardTitle>On-Time Video Delivery</CardTitle>
                <CardDescription>
                    Per-video punctuality, credited to the video&rsquo;s main editor. A video counts as on time
                    if it was handed to the lecturer on or before its deadline — the video&rsquo;s own due date
                    where one is set, otherwise the project due date. Measured against the most recently agreed
                    deadline, so deadline changes the lecturer asked for are not counted as lateness.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[240px]">Editor Name</TableHead>
                            <TableHead className="text-right">Measured</TableHead>
                            <TableHead className="text-right">On Time</TableHead>
                            <TableHead className="text-right">Late</TableHead>
                            <TableHead className="text-right">Not Tracked</TableHead>
                            <TableHead className="text-right">On-Time Rate</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((entry) => {
                            const entryRate = rateOf(entry.onTime, entry.late);
                            return (
                                <TableRow key={entry.editorId}>
                                    <TableCell className="font-medium">{entry.editorName}</TableCell>
                                    <TableCell className="text-right font-mono text-xs">{entry.measured}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            {entry.onTime}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                            {entry.late}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs text-gray-400">
                                        {entry.untracked || "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {entryRate === null ? (
                                            <span className="text-gray-400 text-xs">n/a</span>
                                        ) : (
                                            <Badge variant="outline" className={rateClasses(entryRate)}>
                                                {entryRate}%
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell className="font-semibold">Team Total</TableCell>
                            <TableCell className="text-right font-mono text-xs">{totals.measured}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{totals.onTime}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{totals.late}</TableCell>
                            <TableCell className="text-right font-mono text-xs text-gray-400">
                                {totals.untracked || "—"}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                                {teamRate === null ? "n/a" : `${teamRate}%`}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>

                <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                    {totals.untracked > 0 && (
                        <p>
                            <span className="font-medium text-gray-700">Not Tracked</span> counts delivered
                            videos with no recorded delivery date (delivered before tracking started) or no
                            deadline set. They are excluded from the rate rather than assumed on time.
                        </p>
                    )}
                    <p>
                        <span className="font-medium text-gray-700">Deadline changes in scope:</span>{" "}
                        {deadlineChanges === 0
                            ? "none recorded."
                            : `${deadlineChanges} ${deadlineChanges === 1 ? "deadline was" : "deadlines were"} moved after the project was created.`}{" "}
                        Rescheduling is tracked separately so it stays visible without counting against the team.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
