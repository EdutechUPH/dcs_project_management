// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import Header from "@/components/Header"; // Removed old header
import { Sidebar } from "@/components/Sidebar";

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
        <div className="flex h-screen overflow-hidden bg-white">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-y-auto h-full">
            <main className="flex-1 bg-white">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}