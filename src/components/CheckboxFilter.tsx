// src/components/CheckboxFilter.tsx
'use client';

import * as React from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from "@/lib/utils";

type OneOption = {
    value: string;
    label: string;
};

type CheckboxFilterProps = {
    title: string;
    options: OneOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    /**
     * Mirrors the dropdown's open state to the caller. Closing is the caller's cue to commit
     * the whole selection in one go — ticking three boxes then closing is a single change,
     * not three — and knowing a panel is open lets it hold back "apply" prompts that the
     * close itself is about to make unnecessary.
     */
    onOpenChange?: (open: boolean) => void;
    /** Show the search box above this many options. */
    searchThreshold?: number;
};

export function CheckboxFilter({ title, options, selected, onChange, onOpenChange, searchThreshold = 8 }: CheckboxFilterProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    // Options come straight from the database, where names carry stray whitespace and
    // arbitrary casing — sort and match on a trimmed, lowercased copy so "  Zulkifli"
    // doesn't sort ahead of "Adi" and a search for "fst" finds "FST".
    const sorted = React.useMemo(
        () => [...options].sort((a, b) => a.label.trim().localeCompare(b.label.trim())),
        [options]
    );

    const visible = React.useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return sorted;
        return sorted.filter(o => o.label.toLowerCase().includes(needle));
    }, [sorted, search]);

    const showSearch = options.length > searchThreshold;

    // The trigger names the actual selection where it fits. "Lecturers · Dr Sari" tells
    // you what is filtered without opening anything; "(1)" makes you go look.
    const triggerLabel = React.useMemo(() => {
        if (selected.length === 0) return title;
        if (selected.length === 1) {
            const match = options.find(o => o.value === selected[0]);
            if (match) return `${title} · ${match.label.trim()}`;
        }
        return `${title} · ${selected.length} selected`;
    }, [selected, options, title]);

    const toggle = (value: string) => {
        onChange(selected.includes(value) ? selected.filter(s => s !== value) : [...selected, value]);
    };

    return (
        <Popover
            open={open}
            onOpenChange={next => {
                setOpen(next);
                if (!next) setSearch('');
                onOpenChange?.(next);
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "h-9 justify-between bg-white px-3 text-sm font-normal",
                        selected.length > 0 && "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
                    )}
                >
                    <span className="max-w-[180px] truncate">{triggerLabel}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <div className="flex items-center justify-between border-b bg-gray-50/60 px-3 py-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600">{title}</h4>
                    <div className="flex items-center gap-1">
                        {visible.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-gray-500 hover:text-gray-900"
                                onClick={() => {
                                    // Scoped to what the search is currently showing, which is what
                                    // "all" means when a filter is applied to the list itself.
                                    const merged = new Set(selected);
                                    visible.forEach(o => merged.add(o.value));
                                    onChange(Array.from(merged));
                                }}
                            >
                                Select all
                            </Button>
                        )}
                        {selected.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => onChange([])}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {showSearch && (
                    <div className="relative border-b px-2 py-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={`Search ${title.toLowerCase()}…`}
                            className="h-8 w-full rounded-md border border-gray-200 bg-white pl-8 pr-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                )}

                <div className="max-h-[280px] space-y-0.5 overflow-y-auto p-2">
                    {sorted.length === 0 && (
                        <p className="p-2 text-center text-sm text-gray-500">No options available</p>
                    )}
                    {sorted.length > 0 && visible.length === 0 && (
                        <p className="p-2 text-center text-sm text-gray-500">
                            Nothing matches &ldquo;{search.trim()}&rdquo;
                        </p>
                    )}
                    {visible.map(option => {
                        const isSelected = selected.includes(option.value);
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => toggle(option.value)}
                                className={cn(
                                    "flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors",
                                    isSelected ? "bg-blue-50/70" : "hover:bg-gray-100"
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                                        isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                                    )}
                                >
                                    {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                </span>
                                <span
                                    className={cn(
                                        "truncate text-sm",
                                        isSelected ? "font-medium text-blue-900" : "text-gray-700"
                                    )}
                                    title={option.label.trim()}
                                >
                                    {option.label.trim()}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
