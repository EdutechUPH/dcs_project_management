// src/app/workload/WorkloadList.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Calendar, Timer } from 'lucide-react';
import React from 'react';
import { type WorkloadProfile, type Video } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const statusColors: { [key: string]: string } = {
  'Done': 'bg-green-100 text-green-800 hover:bg-green-100',
  'Review': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  'Video Editing': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  'Audio Editing': 'bg-pink-100 text-pink-800 hover:bg-pink-100',
  'Scheduled for Taping': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
  'Requested': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  'Ready for Review': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  'Revision Requested': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function WorkloadList({ workloadData }: { workloadData: WorkloadProfile[] }) {
  const [expandedProjects, setExpandedProjects] = useState<number[]>([]);

  const toggleProject = (projectId: number) => {
    setExpandedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const calculateDaysRunning = (dateString: string) => {
    if (!dateString) return 0;
    const assignedDate = new Date(dateString);
    const today = new Date();
    const differenceInTime = today.getTime() - assignedDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays;
  };

  const dcsProfiles = workloadData.filter(p => p.role === 'Digital Content Specialist');
  const idProfiles = workloadData.filter(p => p.role === 'Instructional Designer');
  const otherProfiles = workloadData.filter(p => p.role !== 'Digital Content Specialist' && p.role !== 'Instructional Designer');

  const renderProfiles = (profiles: WorkloadProfile[], color: 'blue' | 'purple' | 'yellow') => {
    const theme = {
      blue: { bg: 'bg-blue-50/30', border: 'border-blue-100', headerBg: 'bg-blue-50/80', text: 'text-blue-900', avatar: 'bg-blue-200 text-blue-700' },
      purple: { bg: 'bg-purple-50/30', border: 'border-purple-100', headerBg: 'bg-purple-50/80', text: 'text-purple-900', avatar: 'bg-purple-200 text-purple-700' },
      yellow: { bg: 'bg-yellow-50/30', border: 'border-yellow-100', headerBg: 'bg-yellow-50/80', text: 'text-yellow-900', avatar: 'bg-yellow-200 text-yellow-700' }
    }[color];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {profiles.map(profile => {
          const totalVideos = profile.ongoing_projects.reduce((acc, item) => acc + item.projects.videos.length, 0);
          return (
            <Card key={profile.id} className={`h-full flex flex-col shadow-sm hover:shadow-md transition-shadow ${theme.border} overflow-hidden`}>
              <CardHeader className={`flex flex-row items-center gap-4 space-y-0 pb-4 ${theme.headerBg} border-b ${theme.border}`}>
                <Avatar className="h-10 w-10 ring-2 ring-white/50">
                  <AvatarFallback className={`${theme.avatar} font-semibold`}>{getInitials(profile.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <CardTitle className={`text-base font-semibold ${theme.text}`}>{profile.full_name}</CardTitle>
                  <div className={`text-xs ${theme.text} opacity-80`}>{profile.role}</div>
                </div>
              </CardHeader>
              <CardContent className={`flex-grow space-y-4 pt-4 ${theme.bg}`}>
                <div className={`text-sm font-medium bg-white/60 p-2 rounded-md text-center shadow-sm border border-white/40 ${theme.text}`}>
                  {profile.ongoing_projects.length} Ongoing Project(s) • {totalVideos} Video(s)
                </div>

              <div className="space-y-2">
                {profile.ongoing_projects.map((assignment) => {
                  const project = assignment.projects;
                  const isExpanded = expandedProjects.includes(project.id);
                  const doneCount = project.videos.filter((v: Video) => v.status === 'Done').length;
                  const totalCount = project.videos.length;
                  const daysRunning = calculateDaysRunning(assignment.assigned_at);

                  return (
                    <div key={assignment.assignment_id} className="border rounded-md transition-colors hover:bg-gray-50/50">
                      <div
                        className="p-3 cursor-pointer select-none"
                        onClick={() => toggleProject(project.id)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold text-sm leading-tight text-gray-800">{project.course_name}</p>
                            <p className="text-xs text-muted-foreground">as {assignment.role}</p>

                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
                              <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                                <Calendar size={10} />
                                {new Date(assignment.assigned_at).toLocaleDateString('en-GB')}
                              </div>
                              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${daysRunning > 14 ? 'bg-red-50 text-red-600' : 'bg-gray-100'}`}>
                                <Timer size={10} />
                                {daysRunning}d ({Math.round(daysRunning / 7)}w)
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                              {doneCount}/{totalCount} Done
                            </Badge>
                            {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-0 border-t bg-gray-50/30">
                          <div className="mt-2 space-y-2">
                            {project.videos.map((video: Video) => (
                              <div key={video.id} className="flex justify-between items-start text-xs gap-2">
                                <span className="text-gray-600 truncate leading-relaxed" title={video.title}>- {video.title}</span>
                                <Badge
                                  variant="outline"
                                  className={`shrink-0 text-[10px] h-5 px-1.5 font-normal border-0 ${statusColors[video.status] || 'bg-gray-100 text-gray-800'}`}
                                >
                                  {video.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          <div className="text-right mt-3">
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600" asChild>
                              <Link href={`/projects/${project.id}`}>
                                View Project Details →
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

  return (
    <div className="space-y-12">
      {dcsProfiles.length > 0 && (
        <section>
          <div className="flex items-center gap-3 border-b border-blue-200 pb-2">
            <h2 className="text-2xl font-bold text-blue-900">Digital Content Specialists</h2>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 shadow-sm">{dcsProfiles.length}</Badge>
          </div>
          {renderProfiles(dcsProfiles, 'blue')}
        </section>
      )}
      {idProfiles.length > 0 && (
        <section>
          <div className="flex items-center gap-3 border-b border-purple-200 pb-2">
            <h2 className="text-2xl font-bold text-purple-900">Instructional Designers</h2>
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 shadow-sm">{idProfiles.length}</Badge>
          </div>
          {renderProfiles(idProfiles, 'purple')}
        </section>
      )}
      {otherProfiles.length > 0 && (
        <section>
          <div className="flex items-center gap-3 border-b border-yellow-200 pb-2">
            <h2 className="text-2xl font-bold text-yellow-900">Other Roles (Admins)</h2>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 shadow-sm">{otherProfiles.length}</Badge>
          </div>
          {renderProfiles(otherProfiles, 'yellow')}
        </section>
      )}
    </div>
  );
}