// src/app/projects/data-table/ExpandedRow.tsx
"use client"

import Link from "next/link"
import { Clapperboard, Languages, Subtitles } from "lucide-react"
import { Video, Project } from "@/lib/types"
import { StatusBadge } from "@/components/insight/StatusBadge"
import { OutOfYearPill } from "@/components/insight/OutOfYearPill"
import { deadlineFor, daysUntil, deadlineLabel, formatDateShort, hasOwnDeadline } from "@/lib/dates"
import { cn } from "@/lib/utils"

/**
 * The per-video detail behind a project row.
 *
 * Rebuilt from a grid of cards into a table. Cards worked at four videos and stopped
 * working at forty-six — the largest project here has 46, which was several screens of
 * scrolling to answer something a table answers in one glance. A table also lets the
 * deadline column line up, which is most of the point of showing deadlines.
 *
 * The columns changed too. It used to show duration, language and subtitle flags —
 * attributes of a finished video — and none of who is editing it, when it is due, or
 * whether it has reached the lecturer, which are the three things you open a row to find
 * out. Language and subtitles survive as quiet icons under the title.
 */
export function ExpandedRow({ project }: { project: Project }) {
    if (!project.videos || project.videos.length === 0) {
        return (
            <div className="border-t bg-gray-50/60 p-6 text-center text-sm text-gray-500">
                No videos in this project yet.
            </div>
        )
    }

    // Same ordering as the project page, so a video sits in the same place on both.
    const videos = [...project.videos].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    const done = videos.filter(v => v.status === "Done").length

    return (
        <div className="border-t bg-gray-50/60 px-5 py-4">
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Clapperboard className="h-4 w-4 text-gray-400" />
                    Videos
                </h4>
                <span className="text-xs text-gray-500">
                    {done} of {videos.length} completed
                </span>
                {project.outOfYearTerm && <OutOfYearPill value={project.outOfYearTerm} />}
                <Link
                    href={`/projects/${project.id}`}
                    className="ml-auto text-xs font-medium text-blue-700 hover:underline"
                >
                    Open project →
                </Link>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full min-w-[44rem] text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 text-left">
                            {["Video", "Status", "Editor", "Deadline", "Delivered"].map(head => (
                                <th
                                    key={head}
                                    className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500"
                                >
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {videos.map(video => (
                            <VideoRow key={video.id} video={video} project={project} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function VideoRow({ video, project }: { video: Video; project: Project }) {
    // The deadline rule from AI_README §11, through the shared helper — the video's own
    // date where it has one, otherwise the project's. Marked when inherited, because "no
    // date of its own" and "no date at all" otherwise look identical.
    const deadline = deadlineFor(video, project)
    const ownDeadline = hasOwnDeadline(video)
    const remaining = video.status === "Done" ? null : daysUntil(deadline)

    const runtime = video.duration_minutes
        ? `${video.duration_minutes}m${video.duration_seconds ? ` ${video.duration_seconds}s` : ""}`
        : null

    return (
        <tr className="hover:bg-gray-50/70">
            <td className="max-w-[22rem] px-3 py-2">
                <div className="truncate font-medium text-gray-900" title={video.title}>
                    {video.title}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {runtime && <span className="tabular-nums">{runtime}</span>}
                    {video.language && (
                        <span className="flex items-center gap-1" title={`Language: ${video.language}`}>
                            <Languages className="h-3 w-3" />
                            {video.language}
                        </span>
                    )}
                    {(video.has_english_subtitle || video.has_indonesian_subtitle) && (
                        <span
                            className="flex items-center gap-1"
                            title={[
                                video.has_english_subtitle ? "English subtitles" : null,
                                video.has_indonesian_subtitle ? "Indonesian subtitles" : null,
                            ].filter(Boolean).join(" · ")}
                        >
                            <Subtitles className="h-3 w-3" />
                            {[video.has_english_subtitle && "EN", video.has_indonesian_subtitle && "ID"]
                                .filter(Boolean)
                                .join("/")}
                        </span>
                    )}
                </div>
            </td>

            <td className="px-3 py-2">
                <StatusBadge status={video.status} />
            </td>

            <td className="px-3 py-2 text-gray-700">
                {video.profiles?.full_name ?? (
                    // Not necessarily unassigned: with no per-video editor the project's main
                    // editor stands in. Analytics credits per video though (§8), so this work
                    // currently counts towards nobody — worth showing, not worth alarming about.
                    <span
                        className="text-xs italic text-gray-400"
                        title="No editor named on this video; the project's main editor stands in"
                    >
                        from project
                    </span>
                )}
            </td>

            <td className="whitespace-nowrap px-3 py-2">
                {deadline ? (
                    <>
                        <span className="text-gray-700">{formatDateShort(deadline)}</span>
                        {!ownDeadline && (
                            <span
                                className="ml-1 text-xs text-gray-400"
                                title="Inherited from the project — this video has no deadline of its own"
                            >
                                (project)
                            </span>
                        )}
                        {remaining != null && (
                            <div
                                className={cn(
                                    "text-xs",
                                    remaining < 0
                                        ? "text-[#b32f2f]"
                                        : remaining <= 7
                                            ? "text-[#8a5a00]"
                                            : "text-gray-400",
                                )}
                            >
                                {deadlineLabel(remaining)}
                            </div>
                        )}
                    </>
                ) : (
                    <span className="text-xs text-gray-400">No deadline</span>
                )}
            </td>

            <td className="whitespace-nowrap px-3 py-2">
                {video.delivered_at ? (
                    <span className="text-gray-700">{formatDateShort(video.delivered_at)}</span>
                ) : video.status === "Done" || video.status === "Review" ? (
                    // Reached the lecturer before delivery tracking existed, so the date is
                    // genuinely unknown rather than absent. Never rendered as "not delivered".
                    <span
                        className="text-xs text-gray-400"
                        title="Handed over before the app started recording delivery dates"
                    >
                        not recorded
                    </span>
                ) : (
                    <span className="text-xs text-gray-300">—</span>
                )}
            </td>
        </tr>
    )
}
