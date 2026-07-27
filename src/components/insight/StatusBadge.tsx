// src/components/insight/StatusBadge.tsx
'use client';

import { cn } from '@/lib/utils';
import { INK } from './tokens';

/**
 * One colour per status, for every surface that shows one.
 *
 * There were three of these maps — in the projects table, the workload cards and the
 * expanded project row — and they disagreed. `Video Editing` was blue in one and purple
 * in another, and the expanded row had no entry for `Pending` or `Cancelled` at all, so
 * a parked video rendered in the same neutral grey as `Requested`: the label said one
 * thing and the colour said another.
 *
 * Anything unrecognised falls through to grey rather than to blue, so a new value added
 * to the `project_status` enum can never masquerade as work in progress.
 */
const STATUS_STYLES: Record<string, { color: string; background: string }> = {
    // 'Active' is what live project rows actually carry — it is not in the project_status
    // enum documented in AI_README §4, but it is the most common value in the table, so it
    // must not fall through to the neutral grey.
    'Active': { color: '#1c5cab', background: '#e8f1fc' },
    'Done': { color: '#0a7d0a', background: '#e9f7e9' },
    'Review': { color: '#8a5a00', background: '#fdf3dd' },
    'Video Editing': { color: '#1c5cab', background: '#e8f1fc' },
    'Audio Editing': { color: '#1c5cab', background: '#e8f1fc' },
    'Scheduled for Taping': { color: '#4a3aa7', background: '#eceafa' },
    'Requested': { color: '#52514e', background: '#f1f0ec' },
    'Pending': { color: '#8a5a00', background: '#faf1e2' },
    'Cancelled': { color: '#6b6a66', background: '#eeedea' },
};

const NEUTRAL_STATUS = { color: INK.secondary, background: INK.track };

export function statusStyle(status: string | null | undefined) {
    return (status && STATUS_STYLES[status]) || NEUTRAL_STATUS;
}

export function StatusBadge({
    status,
    className,
}: {
    status: string | null | undefined;
    className?: string;
}) {
    const style = statusStyle(status);
    return (
        <span
            className={cn(
                'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
                className,
            )}
            style={{ color: style.color, background: style.background }}
        >
            {status || 'Unknown'}
        </span>
    );
}
