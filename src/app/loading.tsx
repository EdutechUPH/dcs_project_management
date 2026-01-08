import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="p-8 space-y-8">
            {/* Dashboard Stats Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="bg-white/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                <Skeleton className="h-4 w-24" />
                            </CardTitle>
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-12 mb-1" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Header & Search Skeleton */}
            <div className="flex justify-between items-center mb-6 mt-8 gap-4">
                <Skeleton className="h-9 w-64" /> {/* Title */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-64" /> {/* Search Bar */}
                    <Skeleton className="h-10 w-32" /> {/* Button */}
                </div>
            </div>

            {/* Filter Controls Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>

            {/* Tabs Skeleton */}
            <div className="w-full">
                <Skeleton className="h-10 w-[400px] rounded-full mb-6" />

                {/* Table Skeleton */}
                <div className="rounded-md border shadow-sm bg-white overflow-hidden">
                    <div className="border-b bg-gray-50 p-4">
                        <div className="flex gap-4">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                    <div className="p-4 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4 items-center">
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
