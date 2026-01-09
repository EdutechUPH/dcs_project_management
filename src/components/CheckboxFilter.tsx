'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from "@/components/ui/badge";

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

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between w-full h-10 px-3 bg-white"
                >
                    <span className="truncate">
                        {selected.length === 0
                            ? title
                            : `${title} (${selected.length})`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <div className="p-2 border-b">
                    <h4 className="font-medium text-sm text-gray-700 leading-none mb-1">{title}</h4>
                    <p className="text-xs text-gray-500">Select one or more options.</p>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
                    {options.length === 0 && (
                        <p className="text-sm text-gray-500 p-2 text-center">No options available</p>
                    )}
                    {options.map((option) => {
                        const isSelected = selected.includes(option.value);
                        return (
                            <label
                                key={option.value}
                                className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={isSelected}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            onChange([...selected, option.value]);
                                        } else {
                                            onChange(selected.filter(s => s !== option.value));
                                        }
                                    }}
                                />
                                <span className="text-sm text-gray-700 pt-0.5">{option.label}</span>
                            </label>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
