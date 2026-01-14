// src/app/analytics/EditorLeaderboard.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type LeaderboardEntry = {
    editorId: string;
    editorName: string;
    completedVideos: number;
    activeVideos: number;
    minutesProduced: number;
};

type LeaderboardProps = {
    data: LeaderboardEntry[];
};

export default function EditorLeaderboard({ data }: LeaderboardProps) {
    // Sort by Completed Videos desc, then Minutes desc
    const sortedData = [...data].sort((a, b) => b.completedVideos - a.completedVideos || b.minutesProduced - a.minutesProduced);

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Editor Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Editor Name</TableHead>
                            <TableHead className="text-right">Completed</TableHead>
                            <TableHead className="text-right">Active Tasks</TableHead>
                            <TableHead className="text-right">Minutes Produced</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.map((entry) => (
                            <TableRow key={entry.editorId}>
                                <TableCell className="font-medium">{entry.editorName}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        {entry.completedVideos}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {entry.activeVideos}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                    {entry.minutesProduced.toFixed(1)}m
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
