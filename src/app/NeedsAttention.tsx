// src/app/NeedsAttention.tsx
//
// Triage, not analysis: the three things a coordinator can act on this morning.
// Deliberately narrow — anything retrospective belongs on /analytics instead.
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Hourglass, UserX } from "lucide-react";
import { ChartCard } from "@/components/insight/primitives";
import { STATUS } from "@/components/insight/tokens";

export type OverdueItem = { projectId: number; courseName: string; daysLate: number; remaining: number };
export type ReviewItem = { projectId: number; courseName: string; title: string; daysWaiting: number | null };
export type UnassignedItem = { projectId: number; courseName: string; count: number };

type Props = {
    overdue: OverdueItem[];
    inReview: ReviewItem[];
    unassigned: UnassignedItem[];
    /** In-review videos with no recorded hand-off date, so their wait can't be measured. */
    reviewUndated: number;
    /** Videos relying on the project's main editor instead of naming their own. */
    inheritedEditorVideos: number;
};

function Column({
    icon,
    title,
    count,
    tone,
    empty,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    count: number;
    tone: string;
    empty: string;
    children: React.ReactNode;
}) {
    return (
        <div className="min-w-0">
            <div className="flex items-center gap-2">
                <span style={{ color: count > 0 ? tone : STATUS.good }}>{icon}</span>
                <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-gray-500">{title}</h4>
                <span
                    className="ml-auto text-sm font-semibold tabular-nums"
                    style={{ color: count > 0 ? tone : STATUS.good }}
                >
                    {count}
                </span>
            </div>
            <div className="mt-2.5 space-y-1.5">
                {count === 0 ? (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        <CheckCircle2 className="h-3.5 w-3.5" style={{ color: STATUS.good }} />
                        {empty}
                    </p>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

// Long course names wrap to a second line and only then clip, instead of being cut off mid-word
// on the first. `title` carries the full string for a tooltip either way.
const rowClass =
    "-mx-1.5 block rounded px-1.5 py-1 text-xs leading-snug text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden";

export default function NeedsAttention({
    overdue,
    inReview,
    unassigned,
    reviewUndated,
    inheritedEditorVideos,
}: Props) {
    const nothingToDo = overdue.length === 0 && inReview.length === 0 && unassigned.length === 0;

    return (
        <ChartCard
            title="Needs attention"
            description="Live projects only. Completed, pending and cancelled work is excluded."
            aside={
                nothingToDo ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: STATUS.good }}>
                        <CheckCircle2 className="h-4 w-4" />
                        All clear
                    </span>
                ) : undefined
            }
            footnote={
                reviewUndated > 0 || inheritedEditorVideos > 0 ? (
                    <>
                        {reviewUndated > 0 && (
                            <>
                                <span className="font-medium text-gray-700">Sent date unknown</span> means the video
                                is with a lecturer but was handed over before the app started recording hand-off
                                dates, so there is no way to tell how long it has been waiting.{" "}
                                {reviewUndated} {reviewUndated === 1 ? "video is" : "videos are"} in that state, and
                                counted in the queue.{" "}
                            </>
                        )}
                        {inheritedEditorVideos > 0 && (
                            <>
                                Separately, {inheritedEditorVideos}{" "}
                                {inheritedEditorVideos === 1 ? "video uses" : "videos use"} the project&rsquo;s main
                                editor rather than naming one per video. Nothing is unassigned, but analytics credits
                                editing per video, so that work currently counts towards nobody.
                            </>
                        )}
                    </>
                ) : undefined
            }
        >
            <div className="grid gap-6 sm:grid-cols-3">
                <Column
                    icon={<AlertTriangle className="h-4 w-4" />}
                    title="Overdue"
                    count={overdue.length}
                    tone={STATUS.critical}
                    empty="Nothing past its deadline"
                >
                    {overdue.slice(0, 4).map(item => (
                        <Link
                            key={item.projectId}
                            href={`/projects/${item.projectId}`}
                            title={item.courseName}
                            className={rowClass}
                        >
                            <span className="font-medium">{item.courseName}</span>
                            <span className="text-gray-500">
                                {" "}— {item.daysLate}d late,{" "}
                                {item.remaining === 0 ? "all videos done" : `${item.remaining} left`}
                            </span>
                        </Link>
                    ))}
                    {overdue.length > 4 && (
                        <p className="px-1.5 text-xs text-gray-400">+{overdue.length - 4} more</p>
                    )}
                </Column>

                <Column
                    icon={<Hourglass className="h-4 w-4" />}
                    title="Waiting on lecturer"
                    count={inReview.length}
                    tone={STATUS.warning}
                    empty="No videos sitting in review"
                >
                    {inReview.slice(0, 4).map(item => (
                        <Link
                            key={`${item.projectId}-${item.title}`}
                            href={`/projects/${item.projectId}`}
                            title={`${item.title} — ${item.courseName}`}
                            className={rowClass}
                        >
                            <span className="font-medium">{item.title}</span>
                            <span className="text-gray-500">
                                {" "}—{" "}
                                {item.daysWaiting != null
                                    ? `waiting ${item.daysWaiting}d`
                                    : "sent date unknown"}
                            </span>
                        </Link>
                    ))}
                    {inReview.length > 4 && (
                        <p className="px-1.5 text-xs text-gray-400">+{inReview.length - 4} more</p>
                    )}
                </Column>

                <Column
                    icon={<UserX className="h-4 w-4" />}
                    title="No main editor"
                    count={unassigned.reduce((sum, u) => sum + u.count, 0)}
                    tone={STATUS.serious}
                    empty="Every live video has an editor"
                >
                    {unassigned.slice(0, 4).map(item => (
                        <Link
                            key={item.projectId}
                            href={`/projects/${item.projectId}`}
                            title={item.courseName}
                            className={rowClass}
                        >
                            <span className="font-medium">{item.courseName}</span>
                            <span className="text-gray-500">
                                {" "}— {item.count} {item.count === 1 ? "video" : "videos"}
                            </span>
                        </Link>
                    ))}
                    {unassigned.length > 4 && (
                        <p className="px-1.5 text-xs text-gray-400">+{unassigned.length - 4} more projects</p>
                    )}
                </Column>
            </div>
        </ChartCard>
    );
}
