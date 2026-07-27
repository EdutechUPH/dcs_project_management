// src/app/analytics/DeadlineRisk.tsx
"use client";

import Link from "next/link";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { ChartCard, EmptyState } from "./ui";
import { INK, STATUS, compactNumber } from "./chart-theme";

export type RiskBucket = {
    key: "overdue" | "week" | "month" | "later" | "none";
    label: string;
    count: number;
};

export type AtRiskProject = {
    projectId: number;
    courseName: string;
    dueDate: string | null;
    /** Negative = still has time; positive = days past the deadline. */
    daysLate: number | null;
    remaining: number;
};

type Props = {
    buckets: RiskBucket[];
    atRisk: AtRiskProject[];
};

// Severity is carried by the status palette AND by the label beside it — never by
// colour alone, which is why every bucket prints its own name and count.
const BUCKET_COLOR: Record<RiskBucket["key"], string> = {
    overdue: STATUS.critical,
    week: STATUS.serious,
    month: STATUS.warning,
    later: STATUS.good,
    none: INK.axis,
};

export default function DeadlineRisk({ buckets, atRisk }: Props) {
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    const overdue = buckets.find(b => b.key === "overdue")?.count ?? 0;

    if (total === 0) {
        return (
            <ChartCard title="Deadline risk" description="Unfinished videos by how close their deadline is.">
                <EmptyState icon={<ShieldCheck className="h-8 w-8" />} title="Nothing in production">
                    Every video in scope is finished, or sits in a Pending or Cancelled project.
                </EmptyState>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title="Deadline risk"
            description="Unfinished videos by how close their deadline is."
            titleNote="The deadline is the video's own due date where one is set, otherwise the project's — the same rule the on-time table uses, so the two cards can never disagree. A video counts as overdue while it is unfinished and its deadline has passed, regardless of who is holding it up."
            aside={
                <div className="text-right">
                    <p
                        className="text-2xl font-semibold leading-none tracking-tight"
                        style={{ color: overdue > 0 ? "#b32f2f" : INK.primary }}
                    >
                        {compactNumber(overdue)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">past deadline</p>
                </div>
            }
            // No footnote: the aside already shows the overdue figure at 2xl, and the
            // buckets beside it show what is due soon. Restating both in prose underneath
            // said nothing the reader had not just read.
        >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                {/* Buckets — a stacked severity band plus a labelled breakdown */}
                <div>
                    <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full" aria-hidden>
                        {buckets
                            .filter(b => b.count > 0)
                            .map(b => (
                                <div
                                    key={b.key}
                                    style={{ flexGrow: b.count, background: BUCKET_COLOR[b.key] }}
                                    title={`${b.label}: ${b.count}`}
                                />
                            ))}
                    </div>

                    <ul className="mt-5 space-y-3">
                        {buckets.map(b => (
                            <li key={b.key} className="flex items-center gap-3 text-sm">
                                <span
                                    aria-hidden
                                    className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                                    style={{ background: BUCKET_COLOR[b.key] }}
                                />
                                <span className="flex-1 text-gray-600">{b.label}</span>
                                <span className="font-semibold tabular-nums text-gray-900">{b.count}</span>
                                <span className="w-10 text-right text-xs tabular-nums text-gray-500">
                                    {((b.count / total) * 100).toFixed(0)}%
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* The actionable half: which projects are actually behind */}
                <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-gray-500">
                        Most overdue projects
                    </p>
                    {atRisk.length === 0 ? (
                        <div className="flex h-full min-h-[7rem] items-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-sm text-gray-500">
                            No project in scope has videos in production past its deadline.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {atRisk.map(p => (
                                <li key={p.projectId} className="flex items-center gap-3 py-2.5">
                                    <AlertTriangle
                                        className="h-4 w-4 shrink-0"
                                        style={{ color: STATUS.critical }}
                                        aria-hidden
                                    />
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={`/projects/${p.projectId}`}
                                            className="block truncate text-sm font-medium text-gray-900 hover:underline"
                                            title={p.courseName}
                                        >
                                            {p.courseName}
                                        </Link>
                                        <p className="text-xs text-gray-500">
                                            {p.remaining} in production {p.remaining === 1 ? "video" : "videos"}
                                            {p.dueDate ? ` · due ${p.dueDate}` : ""}
                                        </p>
                                    </div>
                                    <span
                                        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
                                        style={{ background: "#fdeeee", color: "#b32f2f" }}
                                    >
                                        {p.daysLate}d late
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </ChartCard>
    );
}
