'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTransition } from 'react';

export default function TeamFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const mainEditorOnly = searchParams.get('mainEditorOnly') !== 'false'; // Default true

    const handleToggle = (checked: boolean) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('mainEditorOnly', checked.toString());

        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    }

    return (
        <div className="flex items-center space-x-2 mb-4 p-4 bg-gray-50 rounded-lg border">
            <Switch
                id="main-editor-mode"
                checked={mainEditorOnly}
                onCheckedChange={handleToggle}
                disabled={isPending}
            />
            <Label htmlFor="main-editor-mode" className="text-sm font-medium cursor-pointer">
                Show Main Editors / Videographers Only
            </Label>
            {isPending && <span className="text-xs text-muted-foreground ml-2">Updating...</span>}
        </div>
    )
}
