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
            setVideos(videos.map(v => v.id === selectedVideo.id ? { ...v, status: 'Revision Requested', revision_notes: revisionNote } : v));
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
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900">Project Review</h1>
                    <p className="text-gray-600">Course: <span className="font-semibold">{project.course_name}</span></p>
                    <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md flex gap-2 items-start">
                        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                        <p className="text-sm">Please review the videos below. Once all videos are approved, you will be able to complete the feedback survey.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {videos.map(video => (
                        <Card key={video.id} className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{video.title}</h3>
                                            <Badge variant={video.status === 'Done' ? 'default' : 'outline'}>{video.status}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-500">Duration: {video.duration_minutes}m {video.duration_seconds}s</p>

                                        {video.video_link ? (
                                            <a href={video.video_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                                                <PlayCircle size={16} /> Watch Video
                                            </a>
                                        ) : (
                                            <span className="text-sm text-red-500 italic">Video link unavailable</span>
                                        )}

                                        {/* Show existing revision note if any */}
                                        {video.status === 'Revision Requested' && video.revision_notes && (
                                            <div className="mt-2 text-xs bg-orange-50 text-orange-800 p-2 rounded border border-orange-100">
                                                <span className="font-semibold">Pending Revision:</span> {video.revision_notes}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        {video.status === 'Done' ? (
                                            <Button variant="outline" disabled className="text-green-600 border-green-200 bg-green-50">
                                                <CheckCircle size={16} className="mr-2" /> Approved
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                                    onClick={() => {
                                                        setSelectedVideo(video);
                                                        setRevisionNote('');
                                                        setIsDialogOpen(true);
                                                    }}
                                                >
                                                    <MessageSquare size={16} className="mr-2" /> Request Revision
                                                </Button>

                                                <Button onClick={() => handleApprove(video.id)} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
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
