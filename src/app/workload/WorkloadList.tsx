// src/app/workload/WorkloadList.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Calendar, Timer } from 'lucide-react';
import React from 'react';
import { type Profile } from '@/lib/types';

// Define a more specific type for the workload data
type WorkloadProfile = Profile & {
  ongoing_projects: {
    assignment_id: number;
    role: string;
    assigned_at: string;
    projects: any; // Keeping this flexible as project shape is complex here
  }[];
};

const statusColors: { [key: string]: string } = {
  'Done': 'bg-green-100 text-green-800',
  'Review': 'bg-yellow-100 text-yellow-800',
  'Video Editing': 'bg-purple-100 text-purple-800',
  'Audio Editing': 'bg-pink-100 text-pink-800',
  'Scheduled for Taping': 'bg-indigo-100 text-indigo-800',
  'Requested': 'bg-gray-100 text-gray-800',
};

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workloadData.map(profile => {
        const totalVideos = profile.ongoing_projects.reduce((acc: number, item) => acc + item.projects.videos.length, 0);
        return (
          <div key={profile.id} className="bg-white border rounded-lg shadow flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">{profile.full_name}</h2>
              <p className="text-sm text-gray-600">{profile.role}</p>
              <p className="text-sm font-bold mt-2">
                {profile.ongoing_projects.length} Ongoing Project(s) / {totalVideos} Video(s)
              </p>
            </div>
            <div className="p-2 space-y-1 flex-grow">
              {profile.ongoing_projects.map((assignment) => {
                const project = assignment.projects;
                const isExpanded = expandedProjects.includes(project.id);
                const doneCount = project.videos.filter((v: any) => v.status === 'Done').length;
                const totalCount = project.videos.length;
                const daysRunning = calculateDaysRunning(assignment.assigned_at);
                
                return (
                  <div key={assignment.assignment_id} className="rounded-md hover:bg-gray-50">
                    <div className="p-2 cursor-pointer" onClick={() => toggleProject(project.id)}>
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm">{project.course_name}</p>
                          <p className="text-xs text-gray-500">as <span className="font-medium">{assignment.role}</span></p>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar size={12} /> Assigned: {new Date(assignment.assigned_at).toLocaleDateString('en-GB')}</span>
                            <span className="flex items-center gap-1"><Timer size={12} /> {daysRunning} days ago</span>
                          </div>

                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded-full">{doneCount}/{totalCount} Done</span>
                          {isExpanded ? <ChevronDown size={16} className="text-gray-500"/> : <ChevronRight size={16} className="text-gray-500" />}
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="pb-2 px-2">
                        <ul className="pl-4 border-l-2 ml-1 space-y-1 mt-1">
                          {project.videos.map((video: any) => (
                            <li key={video.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">- {video.title}</span>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[video.status] || 'bg-gray-100'}`}>{video.status}</span>
                            </li>
                          ))}
                        </ul>
                         <div className="text-right mt-2">
                           <Link href={`/projects/${project.id}`} className="text-xs text-blue-600 hover:underline">
                             Go to project →
                           </Link>
                         </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}