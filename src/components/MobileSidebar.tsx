"use client"

import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { useState } from "react"

export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden p-2 absolute top-4 left-4 z-50">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-gray-900 border-r-gray-800 text-white">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                {/* We reuse the Sidebar component but ensure it fits the mobile context */}
                <Sidebar mobile />
            </SheetContent>
        </Sheet>
    )
}
