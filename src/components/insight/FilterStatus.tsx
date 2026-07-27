// src/components/insight/FilterStatus.tsx
//
// Shares a filter toolbar's state with the content below it, so a data region can show
// that it is out of date. The toolbar is a client island and the content is usually
// server rendered, so a tiny context is the seam between them.
//
// Lifted out of /analytics, where it was written, once a second and third page needed the
// same behaviour. Two copies of "is this view stale?" is exactly the kind of thing that
// drifts until one page veils on pending and another veils on dirty.
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = {
    /** A refetch is in flight. */
    isPending: boolean;
    /** The controls have been changed but not committed, so the content is behind. */
    isDirty: boolean;
    /** A filter panel is open, so closing it will commit the change without any further action. */
    willApplyOnClose: boolean;
};

type FilterStatusValue = Status & { report: (status: Status) => void };

const FilterStatusContext = createContext<FilterStatusValue>({
    isPending: false,
    isDirty: false,
    willApplyOnClose: false,
    report: () => { },
});

export function FilterStatusProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<Status>({
        isPending: false,
        isDirty: false,
        willApplyOnClose: false,
    });

    const value = useMemo<FilterStatusValue>(
        () => ({ ...status, report: setStatus }),
        [status]
    );

    return <FilterStatusContext.Provider value={value}>{children}</FilterStatusContext.Provider>;
}

/** Called by the toolbar to publish its state. */
export function useReportFilterStatus(status: Status) {
    const { report } = useContext(FilterStatusContext);
    const { isPending, isDirty, willApplyOnClose } = status;

    useEffect(() => {
        report({ isPending, isDirty, willApplyOnClose });
    }, [report, isPending, isDirty, willApplyOnClose]);
}

export function useFilterStatus() {
    const { isPending, isDirty, willApplyOnClose } = useContext(FilterStatusContext);
    return { isPending, isDirty, willApplyOnClose };
}

/**
 * The floating caption. Render ONCE per page, even where several regions are veiled — one
 * status message describes one page, and two identical pills stacked on top of each other
 * read as a bug.
 *
 * `top` takes a Tailwind class because the right offset depends on what the page puts
 * above it: a sticky toolbar needs clearing, a static one does not.
 */
export function StaleBanner({ top = "top-28" }: { top?: string }) {
    const { isPending, isDirty, willApplyOnClose } = useFilterStatus();
    if (!isPending && !isDirty) return null;

    // Three different situations, three different things to say. While a panel is open the
    // caption is a promise, not an instruction — there is nothing for the user to do.
    const caption = isPending
        ? "Updating results…"
        : willApplyOnClose
            ? "Results update when you close this"
            : "Showing previous results — apply your change to update";

    return (
        // Fixed rather than in flow: an element that appears and disappears on every filter
        // change must not push the content up and down as it does so.
        <div className={cn("pointer-events-none fixed inset-x-0 z-30 flex justify-center print:hidden", top)}>
            <span
                className={cn(
                    "pointer-events-auto inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium shadow-lg",
                    // Amber only where the user has to act. A change that applies itself is
                    // information, not a warning.
                    isPending || willApplyOnClose
                        ? "border-blue-200 bg-white text-blue-900"
                        : "border-amber-300 bg-amber-50 text-amber-900"
                )}
                role="status"
            >
                {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                )}
                {caption}
            </span>
        </div>
    );
}

/**
 * Veils its children whenever what they show no longer matches the controls above them —
 * either because a refetch is running or because a change hasn't been committed.
 *
 * Deliberately restrained: a 3px blur plus dimming, not a heavy frost. The blurred subtree
 * can be every chart on a page, and `filter` forces the whole thing to be rasterised on
 * the GPU, so the cheap version is the one that stays smooth. Under prefers-reduced-motion
 * it degrades to dimming alone, because blurred text is a real accessibility problem
 * rather than a stylistic preference.
 *
 * Safe to use more than once per page; pair with a single `StaleBanner`.
 */
export function StaleContent({ children }: { children: React.ReactNode }) {
    const { isPending, isDirty } = useFilterStatus();
    const isStale = isPending || isDirty;

    return (
        <div
            aria-busy={isStale}
            className={cn(
                "transition-[filter,opacity] duration-200 ease-out",
                isStale &&
                "select-none opacity-50 blur-[3px] saturate-50 motion-reduce:blur-none motion-reduce:saturate-100",
                // Numbers you cannot read are numbers you must not be able to click through to.
                isStale && "pointer-events-none",
                // Paper has no pending state. Without this, printing mid-refetch would
                // commit the blur to the PDF permanently.
                "print:!blur-none print:!opacity-100 print:!saturate-100",
            )}
        >
            {children}
        </div>
    );
}
