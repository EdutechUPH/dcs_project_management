"use client"

import { Video, Project } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Clapperboard, MonitorPlay, Mic, Languages } from "lucide-react"

// Simple Badge component if not yet created, or we can assume we will create it.
// I'll assume standard shadcn/li imports for now and if they fail I'll create them. 
// Actually to be safe and "wow" the user I should create the Badge and Avatar components first or inline them.
// Let's create a specialized visual component here without external deps for now to ensure it works immediately, 
// then I can refactor to real shadcn components if I have time, or better yet, I will use standard Tailwind for now to ensure speed.

const statusColors: { [key: string]: string } = {
    'Done': 'bg-green-100 text-green-800 border-green-200',
    'Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Video Editing': 'bg-purple-100 text-purple-800 border-purple-200',
    'Audio Editing': 'bg-pink-100 text-pink-800 border-pink-200',
    'Scheduled for Taping': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Requested': 'bg-gray-100 text-gray-800 border-gray-200',
};

const StatusBadge = ({ status }: { status: string }) => {
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
            {status}
        </span>
    );
}

export function ExpandedRow({ project }: { project: Project }) {
    if (!project.videos || project.videos.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 bg-gray-50/50">
                No videos assigned to this project yet.
            </div>
        )
    }

    return (
        <div className="p-6 bg-gray-50/50 border-t shadow-inner">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-blue-600" />
                Project Videos ({project.videos.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.videos.map((video) => (
                    <div key={video.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <h5 className="font-medium text-gray-900 text-sm line-clamp-2" title={video.title}>
                                    {video.title}
                                </h5>
                                <div className="mt-2">
                                    <StatusBadge status={video.status} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center text-xs text-gray-500">
                                <MonitorPlay className="w-3.5 h-3.5 mr-2" />
                                <span>Duration: {video.duration_minutes ? `${video.duration_minutes}m` : '--'}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                                <Languages className="w-3.5 h-3.5 mr-2" />
                                <span>Lang: {video.language || 'N/A'}</span>
                            </div>
                            {/* We could add assigned editor here if we had the data easily mapped */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
