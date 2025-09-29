// src/app/ProjectList.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { type Project } from '@/lib/types'; // Import our new type

type ProjectListProps = {
  projects: Project[]; // Use the specific Project type
};

const statusColors: { [key: string]: string } = {
  'Done': 'bg-green-100 text-green-800',
  'Review': 'bg-yellow-100 text-yellow-800',
  'Video Editing': 'bg-purple-100 text-purple-800',
  'Audio Editing': 'bg-pink-100 text-pink-800',
  'Scheduled for Taping': 'bg-indigo-100 text-indigo-800',
  'Requested': 'bg-gray-100 text-gray-800',
};

export default function ProjectList({ projects }: ProjectListProps) {
  const router = useRouter();
  const [expandedProjectIds, setExpandedProjectIds] = useState<number[]>([]);

  const toggleProject = (projectId: number) => {
    setExpandedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {projects.length > 0 ? (
        projects.map((project) => {
          const isExpanded = expandedProjectIds.includes(project.id);
          const totalCount = project.videos.length;
          const doneCount = project.videos.filter((v) => v.status === 'Done').length;
          const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
          const isOverdue = project.due_date && new Date(project.due_date) < new Date() && progress < 100;
          
          const mainTeam = project.project_assignments.filter((a) => a.role === 'Main Editor / Videographer');
          
          const mainTeamNames = mainTeam
            .map((a) => a.profiles?.full_name)
            .filter(Boolean)
            .join(', ');
            
          const allTeamNames = project.project_assignments
            .map((a) => a.profiles?.full_name)
            .filter(Boolean)
            .join(', ');

          return (
            <React.Fragment key={project.id}>
              <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleProject(project.id)}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{project.course_name}</div>
                  <div className="text-sm text-gray-500">{project.lecturers?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.prodi?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {mainTeamNames || 'Unassigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{doneCount}/{totalCount}</span>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                  {formatDate(project.due_date)}
                  {isOverdue && <div className="text-xs text-red-500">OVERDUE</div>}
                </td>
              </tr>
              {isExpanded && (
                <tr>
                  <td colSpan={5} className="p-0">
                    <div className="p-4 bg-gray-50 border-t border-gray-300">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-sm ml-2">Videos in this Project:</h4>
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.id}`); }}
                          className="text-sm bg-white border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-100"
                        >
                          Manage Project
                        </button>
                      </div>
                      <table className="min-w-full">
                        <thead className="bg-gray-100">
                          <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                            <th className="w-1/2 px-4 py-2">Video Title</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Assigned Team</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {project.videos.map((video) => (
                            <tr key={video.id} className="bg-white">
                              <td className="px-4 py-2 text-sm text-gray-800">{video.title}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[video.status] || 'bg-gray-100 text-gray-800'}`}>
                                  {video.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {allTeamNames || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })
      ) : (
        <tr>
          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No projects found for the selected filters.</td>
        </tr>
      )}
    </tbody>
  );
}