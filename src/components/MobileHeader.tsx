// src/components/MobileHeader.tsx
//
// The mobile top bar: the navigation trigger and the name of the current page.
//
// Mobile only, deliberately. On desktop the sidebar is permanently visible and already
// marks where you are, so a second bar repeating it would be decoration. On a phone the
// sidebar is behind a sheet, and before this the trigger was an `absolute` button floating
// over the content with `pt-14` reserved beneath it — a menu with no context, hovering
// above a page that never said what it was.
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';
import { hidesAppChrome, pageTitle } from '@/lib/nav';

export function MobileHeader() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    // The sheet is portalled, so it survives the navigation that a link inside it starts.
    // Without this it stays open over the page it just took you to.
    useEffect(() => setOpen(false), [pathname]);

    // Radix portals render nothing on the server. Mounting the trigger only on the client
    // keeps the markup identical on both passes; the placeholder holds its width so the
    // title does not jump left on hydration.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (hidesAppChrome(pathname)) return null;

    return (
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-1 border-b border-gray-200 bg-white/90 px-2 backdrop-blur-sm md:hidden print:hidden">
            {mounted ? (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-72 border-r-gray-800 bg-gray-900 p-0 text-white"
                    >
                        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                        <Sidebar mobile />
                    </SheetContent>
                </Sheet>
            ) : (
                <div className="h-9 w-9 shrink-0" aria-hidden />
            )}

            {/* An h2, not an h1: every page already owns its own h1, and a bar that repeats
                the page name at the same level gives a screen reader two titles for one page. */}
            <h2 className="truncate text-sm font-semibold tracking-tight text-gray-900">
                {pageTitle(pathname)}
            </h2>
        </header>
    );
}
