// src/app/analytics/PipelineFunnel.tsx
"use client";

import { ChartCard, EmptyState } from "./ui";
import { BLUE_RAMP, INK, compactNumber } from "./chart-theme";
import { Workflow } from "lucide-react";

export type PipelineStage = {
    stage: string;
    count: number;
};

type Props = {
    data: PipelineStage[];
    /** Videos sitting in a Pending or Cancelled project — parked, not in production. */
    parked: number;
};

/**
 * Where every video in scope currently sits. Built as plain HTML bars rather than a
 * chart library: the stages are a short ordered list, each one needs its count and
 * share directly labelled, and a bar chart would add axes that carry no information
 * a label doesn't already give.
 *
 * The blue ramp is ORDINAL — it steps with position in the workflow, so the darkest
 * bar is always the finish line. It is not categorical identity; stages are not
 * interchangeable series.
 */
export default function PipelineFunnel({ data, parked }: Props) {
    const total = data.reduce((sum, s) => sum + s.count, 0);
    const max = Math.max(...data.map(s => s.count), 1);

    if (total === 0) {
        return (
            <ChartCard title="Production pipeline" description="Where every video in scope currently sits.">
                <EmptyState icon={<Workflow className="h-8 w-8" />} title="No videos in scope">
                    Widen the filters to see the pipeline.
                </EmptyState>
            </ChartCard>
        );
    }

    // Ordinal ramp: spread the available steps across however many stages actually
    // have videos, so the shading always runs light → dark end to end.
    const stepFor = (index: number) => {
        if (data.length === 1) return BLUE_RAMP[4];
        const t = index / (data.length - 1);
        return BLUE_RAMP[Math.round(t * (BLUE_RAMP.length - 1))];
    };

    return (
        <ChartCard
            title="Production pipeline"
            description="Where every video in scope currently sits, in workflow order."
            aside={
                <div className="text-right">
                    <p className="text-2xl font-semibold leading-none tracking-tight text-gray-900">
                        {compactNumber(total)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">videos in scope</p>
                </div>
            }
            coverage={
                parked > 0
                    ? {
                        label: `${parked} parked, not shown`,
                        note: `${parked} further ${parked === 1 ? "video sits" : "videos sit"} in Pending or Cancelled projects and ${parked === 1 ? "is" : "are"} excluded — parked work is not in the pipeline, and folding it into Requested would overstate the queue.`,
                    }
                    : undefined
            }
        >
            <ul className="space-y-3.5">
                {data.map((s, i) => {
                    const share = (s.count / total) * 100;
                    const fill = stepFor(i);
                    return (
                        <li key={s.stage} className="grid grid-cols-[9.5rem_1fr_5.5rem] items-center gap-4">
                            <span className="truncate text-sm font-medium text-gray-700" title={s.stage}>
                                {s.stage}
                            </span>
                            <div
                                className="h-6 w-full overflow-hidden rounded-md"
                                style={{ background: INK.track }}
                            >
                                <div
                                    className="h-full rounded-md"
                                    style={{ width: `${Math.max(1.5, (s.count / max) * 100)}%`, background: fill }}
                                    title={`${s.stage}: ${s.count} videos (${share.toFixed(1)}%)`}
                                />
                            </div>
                            <span className="text-right text-sm tabular-nums text-gray-900">
                                <span className="font-semibold">{s.count}</span>
                                <span className="ml-1.5 text-xs text-gray-500">{share.toFixed(0)}%</span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </ChartCard>
    );
}
