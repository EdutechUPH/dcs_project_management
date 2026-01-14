'use client';

import { addVideoToProject, deleteVideo, updateVideoStatus, moveVideo } from './actions';
import SubmitButton from '@/components/SubmitButton';
import { useRef, useState } from 'react';
import { MAIN_EDITOR_ROLE } from '@/lib/constants';
import { type Video, type Profile, type Assignment } from '@/lib/types';
import { ArrowUp, ArrowDown, Film, AlertCircle, CheckCircle, History as HistoryIcon } from 'lucide-react';
import VideoEditForm from './VideoEditForm';
import VideoHistoryModal from './VideoHistoryModal';
import ConfirmationModal from '@/components/ConfirmationModal';

type VideoListProps = {
  videos: Video[];
  projectId: number;
  profiles: Profile[];
  assignments: Assignment[];
};

const statusColors: { [key: string]: string } = {
  'Done': 'bg-green-100 text-green-800',
  'Review': 'bg-yellow-100 text-yellow-800',
  'Video Editing': 'bg-purple-100 text-purple-800',
  'Audio Editing': 'bg-pink-100 text-pink-800',
  'Scheduled for Taping': 'bg-indigo-100 text-indigo-800',
  'Requested': 'bg-gray-100 text-gray-800',
  'WIP': 'bg-blue-50 text-blue-600 border border-blue-200',
  'Ready for Review': 'bg-yellow-50 text-yellow-600 border border-yellow-200',
  'Revision Requested': 'bg-orange-50 text-orange-600 border border-orange-200',
};

export default function VideoList({ videos, projectId, profiles, assignments }: VideoListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditingDirty, setIsEditingDirty] = useState(false);
  const [historyVideo, setHistoryVideo] = useState<{ id: number, title: string } | null>(null);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning';
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { },
  });

  const addVideoWithId = addVideoToProject.bind(null, projectId);
  const formRef = useRef<HTMLFormElement>(null);

  const handleEditClick = (videoId: number) => {
    if (editingId === videoId) return;

    if (isEditingDirty) {
      setConfirmModal({
        isOpen: true,
        title: 'Unsaved Changes',
        description: 'You have unsaved changes. Discard?',
        variant: 'warning',
        confirmText: 'Discard',
        onConfirm: () => {
          setEditingId(videoId);
          setIsEditingDirty(false);
        }
      });
    } else {
      setEditingId(videoId);
    }
  };

  const projectMainEditor = assignments.find(a => a.role === MAIN_EDITOR_ROLE);
  const projectMainEditorId = projectMainEditor?.profiles?.id || null;

  const sortedVideos = [...videos].sort((a, b) => {
    if (a.position !== null && a.position !== undefined && b.position !== null && b.position !== undefined) {
      return a.position - b.position;
    }
    return a.id - b.id;
  });

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Videos in this Project</h2>
      </div>

      <form
        action={async (formData) => {
          await addVideoWithId(formData);
          formRef.current?.reset();
        }}
        ref={formRef}
        className="mb-6 p-4 border rounded-md bg-gray-50 flex gap-4 items-center"
      >
        <input type="text" name="title" placeholder="New video title" className="flex-grow rounded-md border-gray-300 shadow-sm p-2" required />
        <SubmitButton className="bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700 disabled:bg-gray-400" pendingText="Adding...">Add Video</SubmitButton>
      </form>

      <div className="space-y-4">
        {sortedVideos.length > 0 ? (
          sortedVideos.map((video, index) => (
            <div key={video.id} className="p-4 border rounded-lg bg-white flex gap-4">
              {/* Order Controls */}
              <div className="flex flex-col gap-1 justify-center border-r pr-4">
                <form action={moveVideo}>
                  <input type="hidden" name="videoId" value={video.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="direction" value="up" />
                  <SubmitButton
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
                    pendingText="↑"
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </SubmitButton>
                </form>
                <form action={moveVideo}>
                  <input type="hidden" name="videoId" value={video.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="direction" value="down" />
                  <SubmitButton
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
                    pendingText="↓"
                    disabled={index === sortedVideos.length - 1}
                  >
                    <ArrowDown className="w-5 h-5" />
                  </SubmitButton>
                </form>
              </div>

              <div className="flex-grow">
                {editingId === video.id ? (
                  <VideoEditForm
                    video={video}
                    projectId={projectId}
                    profiles={profiles}
                    projectMainEditorId={projectMainEditorId}
                    onCancel={() => {
                      setEditingId(null);
                      setIsEditingDirty(false);
                    }}
                    onDirtyChange={setIsEditingDirty}
                  />
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{video.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">Duration: {video.duration_minutes || 0}m {video.duration_seconds || 0}s</p>
                        <span className="text-gray-300">|</span>
                        <p className="text-sm text-gray-600">Size: {video.video_size_mb ? `${video.video_size_mb} MB` : 'N/A'}</p>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => setHistoryVideo({ id: video.id, title: video.title })}
                          className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                          title="View Revision History"
                        >
                          <HistoryIcon size={12} /> History
                        </button>
                      </div>

                      {video.revision_notes && video.status !== 'Done' && (
                        <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded flex items-start gap-2 max-w-xl">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold">Lecturer Feedback:</span> {video.revision_notes}
                          </div>
                        </div>
                      )}

                      {video.status === 'Done' && (
                        <div className="mt-1 text-xs text-green-700 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Lecturer Approved
                        </div>
                      )}

                      {video.notes && (
                        <div className="mt-1 text-xs text-gray-500 max-w-xl truncate" title={video.notes}>
                          <span className="font-semibold text-gray-700">Notes:</span> {video.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[video.status] || 'bg-gray-100 text-gray-800'}`}>
                        {video.status}
                      </span>

                      {video.status === 'WIP' && (
                        video.video_link ? (
                          <form action={updateVideoStatus}>
                            <input type="text" name="videoId" value={video.id} readOnly className="hidden" />
                            <input type="text" name="projectId" value={projectId} readOnly className="hidden" />
                            <input type="text" name="newStatus" value="Ready for Review" readOnly className="hidden" />
                            <SubmitButton className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200" pendingText="...">Request Review</SubmitButton>
                          </form>
                        ) : (
                          <span className="text-xs text-red-500 font-medium px-2 py-1 bg-red-50 rounded border border-red-100" title="Add a video link to request review">
                            Link required
                          </span>
                        )
                      )}

                      {video.status === 'Ready for Review' && (
                        <div className="flex gap-2">
                          <form action={updateVideoStatus}>
                            <input type="hidden" name="videoId" value={video.id} />
                            <input type="hidden" name="projectId" value={projectId} />
                            <input type="hidden" name="newStatus" value="Revision Requested" />
                            <SubmitButton className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200" pendingText="...">Request Revision</SubmitButton>
                          </form>
                          <form action={updateVideoStatus}>
                            <input type="hidden" name="videoId" value={video.id} />
                            <input type="hidden" name="projectId" value={projectId} />
                            <input type="hidden" name="newStatus" value="Done" />
                            <SubmitButton className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200" pendingText="...">Approve</SubmitButton>
                          </form>
                        </div>
                      )}

                      {video.status === 'Revision Requested' && (
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs bg-orange-50 text-orange-800 p-2 rounded border border-orange-200 max-w-xs text-right">
                            <strong>Revision Request:</strong><br />
                            {video.revision_notes || "Please check the comments."}
                          </div>
                          <form action={updateVideoStatus}>
                            <input type="hidden" name="videoId" value={video.id} />
                            <input type="hidden" name="projectId" value={projectId} />
                            <input type="hidden" name="newStatus" value="Ready for Review" />
                            <SubmitButton className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200" pendingText="...">Mark Ready</SubmitButton>
                          </form>
                        </div>
                      )}

                      <button onClick={() => handleEditClick(video.id)} className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">Edit</button>
                      <button
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Delete Video',
                            description: 'Are you sure you want to delete this video? This action cannot be undone.',
                            variant: 'danger',
                            confirmText: 'Delete',
                            onConfirm: () => {
                              // We need to submit the form programmatically or call the action
                              // Since actions use FormData, we'll use a hidden form ref or requestSubmit
                              // Ideally, we'd refactor delete to client component usage, 
                              // but for now let's just trigger the form submission associated with this video.
                              // Wait, we can't easily trigger a specific form from here without a ref for EACH video.
                              // Simplest way: keep the form but make the button a type="button" that triggers modal, 
                              // which then triggers a hidden submit button?
                              // Actually, let's keep native confirm for delete for now or refactor properly.
                              // The user asked specifically about the "question" popup (contextually the dirty check one).
                              // But consistency is good. 
                              const form = document.getElementById(`delete-form-${video.id}`) as HTMLFormElement;
                              form?.requestSubmit();
                            }
                          });
                        }}
                        className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 ml-2"
                      >
                        Delete
                      </button>
                      {/* Hidden form for delete */}
                      <form id={`delete-form-${video.id}`} action={deleteVideo} className="hidden">
                        <input type="hidden" name="videoId" value={video.id} />
                        <input type="hidden" name="projectId" value={projectId} />
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
            <div className="bg-gray-100 p-3 rounded-full mb-3">
              <Film className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No videos yet</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Get started by adding a video title above to track its production status.
            </p>
          </div>
        )}
      </div>

      {historyVideo && (
        <VideoHistoryModal
          videoId={historyVideo.id}
          videoTitle={historyVideo.title}
          isOpen={!!historyVideo}
          onClose={() => setHistoryVideo(null)}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText} // Pass optional confirmText
      />
    </div>
  );
}