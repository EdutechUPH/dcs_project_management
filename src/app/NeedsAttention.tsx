// src/app/NeedsAttention.tsx
//
// Triage, not analysis: the three things a coordinator can act on this morning.
// Deliberately narrow — anything retrospective belongs on /analytics instead.
"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Hourglass, UserX } from "lucide-react";
import { InfoNote } from "@/components/insight/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { OutOfYearPill, type OutOfYearTerm } from "@/components/insight/OutOfYearPill";
import { STATUS } from "@/components/insight/tokens";
import { cn } from "@/lib/utils";

export type OverdueItem = {
    projectId: number;
    courseName: string;
    daysLate: number;
    remaining: number;
    /** Set only when the project's term sits outside the active academic year. */
    outOfYearTerm: OutOfYearTerm | null;
};
/**
 * Videos sitting with one lecturer, grouped by their course.
 *
 * Grouped because chasing is one conversation per lecturer, not per video: twenty
 * videos in review turned out to be two courses, and a list of four video titles from
 * the same course looked like a list of four courses.
 */
export type ReviewGroup = {
    projectId: number;
    courseName: string;
    videoCount: number;
    /** Longest measurable wait among that course's videos. Null when none is dated. */
    longestWait: number | null;
    /** How many have no recorded hand-off date, so their wait is unknown. */
    undatedCount: number;
};
export type UnassignedItem = { projectId: number; courseName: string; count: number };

type Props = {
    overdue: OverdueItem[];
    inReview: ReviewGroup[];
    unassigned: UnassignedItem[];
    /** Videos across all those groups — the headline count, since courses is not the unit. */
    reviewVideoCount: number;
    /** In-review videos with no recorded hand-off date, so their wait can't be measured. */
    reviewUndated: number;
    /** Videos relying on the project's main editor instead of naming their own. */
    inheritedEditorVideos: number;
};

/**
 * One actionable row.
 *
 * `metric` is deliberately first and fixed-width. Each list is sorted by it — most
 * overdue first, longest wait first — and when the number trailed a wrapping course
 * title that ordering was invisible, so the list looked arbitrary.
 */
type Row = {
    key: string;
    href: string;
    metric: string;
    metricHint?: string;
    title: string;
    detail?: string;
    badge?: React.ReactNode;
};

// Three rather than four. The fourth row cost a line on every column while the "Show
// all" toggle already covers the rest, and the panel sits above the table it is meant
// to send you to — height here pushes the actual work below the fold.
const PREVIEW_COUNT = 3;

function Column({
    icon,
    title,
    count,
    countUnit,
    tone,
    empty,
    note,
    rows,
    className,
}: {
    icon: React.ReactNode;
    title: string;
    count: number;
    /** What the count counts — "project", "video". Pluralised here. */
    countUnit: string;
    tone: string;
    empty: string;
    /** Caveat for this column, behind an ⓘ. Replaces the card-wide footnote. */
    note?: string;
    rows: Row[];
    className?: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? rows : rows.slice(0, PREVIEW_COUNT);
    const hidden = rows.length - visible.length;

    return (
        <div className={cn("min-w-0", className)}>
            {/* Count sits with its heading. It used to be pushed to the far right of a wide
                column, which put it nearer the NEXT column's title than its own. */}
            <div className="flex items-center gap-2">
                <span style={{ color: count > 0 ? tone : STATUS.good }}>{icon}</span>
                <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-gray-600">{title}</h4>
                {/* The unit is stated because the rows below are not always in it: this
                    column counts videos while listing courses, and a bare "20" against four
                    course names reads as twenty courses. */}
                <span
                    className="whitespace-nowrap text-sm font-semibold tabular-nums"
                    style={{ color: count > 0 ? tone : STATUS.good }}
                >
                    {count}{" "}
                    <span className="text-xs font-medium">
                        {countUnit}{count === 1 ? "" : "s"}
                    </span>
                </span>
                {note && <InfoNote note={note} />}
            </div>

            <div className="mt-2 space-y-0.5">
                {count === 0 ? (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: STATUS.good }} />
                        {empty}
                    </p>
                ) : (
                    <>
                        {visible.map(row => (
                            <Link
                                key={row.key}
                                href={row.href}
                                title={`${row.title}${row.detail ? ` — ${row.detail}` : ""}`}
                                className="-mx-1.5 flex items-baseline gap-2.5 rounded px-1.5 py-1 transition-colors hover:bg-gray-100"
                            >
                                <span
                                    title={row.metricHint}
                                    className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-gray-700"
                                >
                                    {row.metric}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5">
                                        <span className="truncate text-xs leading-snug text-gray-800">
                                            {row.title}
                                        </span>
                                        {row.badge}
                                    </span>
                                    {row.detail && (
                                        <span className="block truncate text-[11px] leading-snug text-gray-500">
                                            {row.detail}
                                        </span>
                                    )}
                                </span>
                            </Link>
                        ))}

                        {/* Expands in place rather than linking away: there is no route that
                            lists "videos waiting on a lecturer", and a link that only sort-of
                            goes there is worse than none. */}
                        {(hidden > 0 || expanded) && (
                            <button
                                type="button"
                                onClick={() => setExpanded(v => !v)}
                                className="-mx-1.5 rounded px-1.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                            >
                                {expanded ? "Show fewer" : `Show all ${rows.length}`}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function NeedsAttention({
    overdue,
    inReview,
    unassigned,
    reviewVideoCount,
    reviewUndated,
    inheritedEditorVideos,
}: Props) {
    const nothingToDo = overdue.length === 0 && inReview.length === 0 && unassigned.length === 0;

    const overdueRows: Row[] = overdue.map(item => ({
        key: String(item.projectId),
        href: `/projects/${item.projectId}`,
        metric: `${item.daysLate}d`,
        metricHint: `${item.daysLate} days past the agreed due date`,
        title: item.courseName,
        detail: item.remaining === 0 ? "all videos done" : `${item.remaining} left`,
        badge: item.outOfYearTerm ? <OutOfYearPill value={item.outOfYearTerm} /> : undefined,
    }));

    const reviewRows: Row[] = inReview.map(group => ({
        key: String(group.projectId),
        href: `/projects/${group.projectId}`,
        // The video count, not a wait: every one of these is currently undated, so a
        // column of dashes carried no information at all. The count does.
        metric: String(group.videoCount),
        metricHint: `${group.videoCount} ${group.videoCount === 1 ? "video" : "videos"} with this lecturer`,
        title: group.courseName,
        detail: group.longestWait != null
            ? `longest wait ${group.longestWait}d${group.undatedCount > 0 ? ` · ${group.undatedCount} undated` : ""}`
            : "sent date unknown",
    }));

    const unassignedRows: Row[] = unassigned.map(item => ({
        key: String(item.projectId),
        href: `/projects/${item.projectId}`,
        metric: String(item.count),
        metricHint: `${item.count} ${item.count === 1 ? "video" : "videos"} with no editor`,
        title: item.courseName,
    }));

    return (
        // Not `ChartCard`: its header is a full-width band above the content, and this card
        // is three short columns under a title that was costing more height than the rows it
        // named. The title becomes the first column instead — same information, one band of
        // vertical space saved on the densest part of the dashboard.
        <Card className="border-gray-200/80 shadow-sm">
            <CardContent className="py-5">
                {/* Hairline dividers, not just gaps. Columns of very unequal length otherwise
                    float in one space with nothing marking where one ends. */}
                <div className="grid gap-5 sm:grid-cols-[11rem_repeat(3,minmax(0,1fr))] sm:gap-0">
                    {/* The card's name, as the first column. It carries no tint or panel —
                        the three data columns must look exactly as they did. What separates
                        it is type: large, dark and sentence case against their small, grey,
                        letterspaced capitals. */}
                    <div className="sm:pr-6">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-lg font-semibold leading-tight tracking-tight text-gray-900">
                                Needs attention
                            </h3>
                            <InfoNote note="Ongoing projects only. Completed, pending and cancelled work is excluded." />
                        </div>
                        {nothingToDo && (
                            <span
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium"
                                style={{ color: STATUS.good }}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                All clear
                            </span>
                        )}
                    </div>

                    <Column
                        icon={<AlertTriangle className="h-4 w-4" />}
                        title="Overdue"
                        count={overdue.length}
                        countUnit="project"
                        tone={STATUS.critical}
                        empty="Nothing past its deadline"
                        rows={overdueRows}
                        className="sm:border-l sm:border-gray-200 sm:px-6"
                    />

                    <Column
                        icon={<Hourglass className="h-4 w-4" />}
                        title="Waiting on lecturer review"
                        count={reviewVideoCount}
                        countUnit="video"
                        tone={STATUS.warning}
                        empty="No videos in review"
                        rows={reviewRows}
                        className="sm:border-l sm:border-gray-200 sm:px-6"
                        note={
                            reviewUndated > 0
                                ? `Videos handed to a lecturer and not yet approved or sent back, grouped by course — the number is videos, the rows are courses. "Sent date unknown" means the hand-off happened before the app started recording those dates, so the wait cannot be measured; ${reviewUndated} ${reviewUndated === 1 ? "video is" : "videos are"} in that state and still counted here.`
                                : "Videos handed to a lecturer and not yet approved or sent back, grouped by course — the number is videos, the rows are courses."
                        }
                    />

                    <Column
                        icon={<UserX className="h-4 w-4" />}
                        title="No main editor"
                        count={unassigned.reduce((sum, u) => sum + u.count, 0)}
                        countUnit="video"
                        tone={STATUS.serious}
                        empty="Every video in production has an editor"
                        rows={unassignedRows}
                        className="sm:border-l sm:border-gray-200 sm:pl-6"
                        note={
                            inheritedEditorVideos > 0
                                ? `Separately, ${inheritedEditorVideos} ${inheritedEditorVideos === 1 ? "video uses" : "videos use"} the project's main editor rather than naming one per video. Nothing is unassigned, but analytics credits editing per video, so that work currently counts towards nobody.`
                                : undefined
                        }
                    />
                </div>
            </CardContent>
        </Card>
    );
}
