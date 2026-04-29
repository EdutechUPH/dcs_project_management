// src/app/analytics/SoundEngineerTable.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SoundEngineerEntry = {
    engineerId: string;
    engineerName: string;
    completedVideos: number;
    activeVideos: number;
    minutesProduced: number;
};

type Props = {
    data: SoundEngineerEntry[];
};

export default function SoundEngineerTable({ data }: Props) {
    const sorted = [...data].sort((a, b) => b.minutesProduced - a.minutesProduced);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sound Engineer Contributions</CardTitle>
                <CardDescription>
                    Sound engineers are credited for all completed videos in their assigned projects.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[240px]">Name</TableHead>
                            <TableHead className="text-right">Completed Videos</TableHead>
                            <TableHead className="text-right">Active Videos</TableHead>
                            <TableHead className="text-right">Minutes Covered</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((entry) => (
                            <TableRow key={entry.engineerId}>
                                <TableCell className="font-medium">{entry.engineerName}</TableCell>
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
