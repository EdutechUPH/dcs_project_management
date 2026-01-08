'use client';

import { useState } from 'react';
import { type Project, type Video } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, MessageSquare, PlayCircle, AlertCircle } from 'lucide-react';
import { externalApproveVideo, externalRequestRevision } from './actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; // Assuming we have or will use standard textarea

// We will import the Survey Form here (need to extract it first)
import FeedbackSurveyForm from './FeedbackSurveyForm';

type DashboardProps = {
    project: Project;
    submissionUuid: string;
};

export default function FeedbackDashboard({ project, submissionUuid }: DashboardProps) {
    const [videos, setVideos] = useState<Video[]>(project.videos || []);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [revisionNote, setRevisionNote] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check if all videos are Done
    const allApproved = videos.length > 0 && videos.every(v => v.status === 'Done');

    const handleApprove = async (videoId: number) => {
        if (!confirm("Are you sure you want to approve this video?")) return;
        setIsSubmitting(true);
        const updated = await externalApproveVideo(submissionUuid, videoId);
        if (updated) {
            setVideos(videos.map(v => v.id === videoId ? { ...v, status: 'Done' } : v));
        }
        setIsSubmitting(false);
    };

    const handleRequestRevision = async () => {
        if (!selectedVideo || !revisionNote.trim()) return;
        setIsSubmitting(true);
        const updated = await externalRequestRevision(submissionUuid, selectedVideo.id, revisionNote);
        if (updated) {
            setVideos(videos.map(v => v.id === selectedVideo.id ? { ...v, status: 'Video Editing', revision_notes: revisionNote } : v));
            setIsDialogOpen(false);
            setRevisionNote('');
            setSelectedVideo(null);
        }
        setIsSubmitting(false);
    };

    if (allApproved) {
        return <FeedbackSurveyForm project={project} submissionUuid={submissionUuid} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Review</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col">
                            <span className="text-gray-500 font-medium">Course Name</span>
                            <span className="text-lg font-semibold text-gray-800">{project.course_name}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-500 font-medium">Lecturer</span>
                            {/* Check for valid lecturer object before accessing name */}
                            <span className="text-lg font-semibold text-gray-800">
                                {project.lecturers && typeof project.lecturers === 'object' && 'name' in project.lecturers
                                    ? (project.lecturers as { name: string }).name
                                    : 'Unknown Lecturer'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-md flex gap-3 items-start border border-blue-100">
                        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium">Review Instructions</p>
                            <p className="text-sm mt-1">Please review the videos below. If extensive edits are needed, click <span className="font-bold">Request Revision</span>. Access the video by clicking the link to open it in a new tab.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {videos.map(video => (
                        <Card key={video.id} className="overflow-hidden border border-gray-200 shadow-sm">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-lg text-gray-900">{video.title}</h3>
                                            <Badge variant={video.status === 'Done' ? 'default' : (video.status === 'Video Editing' ? 'secondary' : 'outline')}>
                                                {video.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 font-mono">Duration: {video.duration_minutes ?? 0}m {video.duration_seconds ?? 0}s</p>

                                        {video.video_link ? (
                                            <a
                                                href={video.video_link.startsWith('http') ? video.video_link : `https://${video.video_link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium transition-colors"
                                            >
                                                <PlayCircle size={18} />
                                                Open Video Link ↗
                                            </a>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm font-medium border border-red-100">
                                                <AlertCircle size={16} /> Video link unavailable
                                            </span>
                                        )}

                                        {/* Status Context Messages */}
                                        {video.status === 'Video Editing' && (
                                            <div className="mt-3 text-sm bg-blue-50 text-blue-800 p-3 rounded-md border border-blue-100 flex gap-2 items-center">
                                                <MessageSquare size={16} />
                                                <span>
                                                    <strong>In Revision:</strong> The editor is currently working on your feedback:
                                                    <span className="italic block mt-1 pl-4 border-l-2 border-blue-200">"{video.revision_notes}"</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 shrink-0 items-center justify-center">
                                        {video.status === 'Done' ? (
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-200 font-medium">
                                                <CheckCircle size={18} /> Approved
                                            </div>
                                        ) : (
                                            <>
                                                {video.status === 'Video Editing' ? (
                                                    <span className="text-sm text-gray-400 italic px-4">Awaiting Editor Changes...</span>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full sm:w-auto text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                                                        onClick={() => {
                                                            setSelectedVideo(video);
                                                            setRevisionNote('');
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <MessageSquare size={16} className="mr-2" /> Request Revision
                                                    </Button>
                                                )}

                                                <Button
                                                    onClick={() => handleApprove(video.id)}
                                                    disabled={isSubmitting || video.status === 'Video Editing'}
                                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 shadow-sm"
                                                >
                                                    <CheckCircle size={16} className="mr-2" /> Approve
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Move Dialog OUTSIDE the map to avoid state/rendering issues */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request Revision for &quot;{selectedVideo?.title}&quot;</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-gray-500">Please describe what needs to be changed. The team will be notified.</p>
                            <Textarea
                                placeholder="e.g., The audio at 0:45 is too quiet..."
                                value={revisionNote}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRevisionNote(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleRequestRevision} disabled={isSubmitting || !revisionNote.trim()}>
                                {isSubmitting ? 'Sending...' : 'Send Request'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
