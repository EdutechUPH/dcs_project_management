// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/MobileSidebar"; // Import MobileSidebar
import { Toaster } from "@/components/ui/sonner";

// Add this line to disable caching for the layout
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DCS Project Tracker",
  description: "A tool to manage video production projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* `app-shell` / `app-scroll` are print hooks, not styling. The shell is a fixed-
            height flex layout with its own scroll container — right for a screen, but on
            paper it clips the document to one viewport and prints the scrollbar track with
            it. globals.css unwinds both under @media print. */}
        <div className="app-shell flex h-screen overflow-hidden bg-white relative">
          <MobileSidebar /> {/* Add Mobile Sidebar Trigger/Sheet */}
          <Sidebar /> {/* Desktop Sidebar (hidden on mobile) */}
          <div className="app-scroll flex-1 flex flex-col overflow-y-auto h-full w-full"> {/* Ensure full width */}
            <main className="flex-1 bg-white pt-14 md:pt-0">{children}</main> {/* Add padding top for mobile menu trigger space */}
          </div>
        </div>
        <div className="print:hidden">
          <Toaster />
        </div>
      </body>
    </html>
  );
}