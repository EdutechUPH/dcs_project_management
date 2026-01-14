// src/components/CheckboxFilter.tsx
'use client';

import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from "@/components/ui/badge";
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
};

export function CheckboxFilter({ title, options, selected, onChange }: CheckboxFilterProps) {
    const [open, setOpen] = React.useState(false);

    const handleClear = (e: React.MouseEvent) => {
        // Stop propagation so the popover doesn't close effectively or weirdly, though usually button click inside popover is fine.
        // We mainly want to prevent bubbling if nested.
        e.stopPropagation();
        onChange([]);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "justify-between h-9 px-3 text-sm font-normal bg-white",
                        selected.length > 0 && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    )}
                >
                    <span className="truncate max-w-[120px]">
                        {selected.length === 0
                            ? title
                            : `${title} (${selected.length})`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <div className="flex items-center justify-between p-2 border-b bg-gray-50/50">
                    <h4 className="font-medium text-xs text-gray-700 uppercase tracking-wider">{title}</h4>
                    {selected.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="h-6 px-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
                        >
                            Clear
                        </Button>
                    )}
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                    {options.length === 0 && (
                        <p className="text-sm text-gray-500 p-2 text-center">No options available</p>
                    )}
                    {options.map((option) => {
                        const isSelected = selected.includes(option.value);
                        return (
                            <div
                                key={option.value}
                                className={cn(
                                    "flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors",
                                    isSelected ? "bg-blue-50/50" : "hover:bg-gray-100"
                                )}
                                onClick={() => {
                                    if (isSelected) {
                                        onChange(selected.filter(s => s !== option.value));
                                    } else {
                                        onChange([...selected, option.value]);
                                    }
                                }}
                            >
                                <div className={cn(
                                    "h-4 w-4 rounded border flex items-center justify-center transition-all",
                                    isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                                )}>
                                    {isSelected && <X className="h-3 w-3 text-white" />}
                                </div>
                                <span className={cn("text-sm pt-0.5", isSelected ? "text-blue-900 font-medium" : "text-gray-700")}>
                                    {option.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
