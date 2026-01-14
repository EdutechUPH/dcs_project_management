'use client';

import { useActionState, useRef, useEffect, useState } from 'react';
import { updateVideo } from './actions';
import { type Video, type Profile } from '@/lib/types';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import SubmitButton from '@/components/SubmitButton';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/ConfirmationModal';

type VideoEditFormProps = {
    video: Video;
    projectId: number;
    profiles: Profile[];
    projectMainEditorId: string | null;
    onCancel: () => void;
    onDirtyChange?: (isDirty: boolean) => void;
};

const videoStatuses = ['Requested', 'Scheduled for Taping', 'Audio Editing', 'Video Editing', 'Review', 'Done'];
const languageOptions = ['Indonesian', 'English', 'Others'];

const initialState = { message: '', error: '' };

export default function VideoEditForm({ video, projectId, profiles, projectMainEditorId, onCancel, onDirtyChange }: VideoEditFormProps) {
    const [state, action, isPending] = useActionState(updateVideo, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Notify parent of dirty state changes
    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    // Effect to handle success and reset dirty state
    useEffect(() => {
        if (!isPending && state?.message) {
            setIsDirty(false);
            toast.success("Video details saved successfully");
        } else if (!isPending && state?.error) {
            toast.error(state.error);
        }
    }, [isPending, state]);

    const handleFieldChange = () => {
        setIsDirty(true);
    };

    const handleCancelClick = () => {
        if (isDirty) {
            setShowConfirm(true);
        } else {
            onCancel();
        }
    };

    return (
        <>
            <form
                key={JSON.stringify(video)} // Reset form if video prop changes externally
                action={action}
                ref={formRef}
                className="space-y-4 border rounded-lg p-4 bg-blue-50/50"
            >
                <input type="hidden" name="videoId" value={video.id} />
                <input type="hidden" name="projectId" value={projectId} />

                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700">Editing Video Details</h3>
                    {isDirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
                </div>

                {/* Feedback Alert in Edit Mode */}
                {video.revision_notes && video.status !== 'Done' && (
                    <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <span className="font-semibold">Lecturer Feedback:</span> {video.revision_notes}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div>
                        <label className="text-sm font-medium">Title</label>
                        <input
                            type="text"
                            name="title"
                            defaultValue={video.title}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                            required
                            onChange={handleFieldChange}
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-sm font-medium">Status</label>
                        <select
                            name="status"
                            defaultValue={video.status}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                            onChange={handleFieldChange}
                        >
                            {videoStatuses.map(status => <option key={status}>{status}</option>)}
                        </select>
                    </div>

                    {/* Main Editor */}
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">Main Editor</label>
                        <select
                            name="main_editor_id"
                            defaultValue={video.main_editor_id || projectMainEditorId || ''}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                            onChange={handleFieldChange}
                        >
                            <option value="">Unassigned</option>
                            {profiles.map(profile => (
                                <option key={profile.id} value={profile.id}>{profile.full_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Language */}
                    <div>
                        <label className="text-sm font-medium">Language</label>
                        <select
                            name="language"
                            defaultValue={video.language || 'Indonesian'}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                            onChange={handleFieldChange}
                        >
                            {languageOptions.map(lang => <option key={lang}>{lang}</option>)}
                        </select>
                    </div>

                    {/* Video Link */}
                    <div>
                        <label className="text-sm font-medium">Video Link</label>
                        <input
                            type="text"
                            name="video_link"
                            defaultValue={video.video_link || ''}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                            onChange={handleFieldChange}
                        />
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Duration:</label>
                        <input
                            type="number"
                            name="duration_minutes"
                            placeholder="Mins"
                            defaultValue={video.duration_minutes || ''}
                            className="block w-20 rounded-md border-gray-300 shadow-sm p-2"
                            onChange={handleFieldChange}
                        />
                        <input
                            type="number"
                            name="duration_seconds"
                            placeholder="Secs"
                            defaultValue={video.duration_seconds || ''}
                            className="block w-20 rounded-md border-gray-300 shadow-sm p-2"
                            onChange={handleFieldChange}
                        />
                    </div>

                    {/* Video Size */}
                    <div>
                        <label className="text-sm font-medium">Video Size (MB)</label>
                        <input
                            type="number"
                            name="video_size_mb"
                            step="0.01"
                            placeholder="e.g. 50.5"
                            defaultValue={video.video_size_mb || ''}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                            onChange={handleFieldChange}
                        />
                    </div>

                    {/* Subtitles */}
                    <div className="flex items-center gap-4 pt-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="has_english_subtitle"
                                id={`eng-sub-${video.id}`}
                                defaultChecked={video.has_english_subtitle}
                                className="h-4 w-4 rounded border-gray-300"
                                onChange={handleFieldChange}
                            />
                            <label htmlFor={`eng-sub-${video.id}`} className="text-sm">English Subtitles</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="has_indonesian_subtitle"
                                id={`ind-sub-${video.id}`}
                                defaultChecked={video.has_indonesian_subtitle}
                                className="h-4 w-4 rounded border-gray-300"
                                onChange={handleFieldChange}
                            />
                            <label htmlFor={`ind-sub-${video.id}`} className="text-sm">Indonesian Subtitles</label>
                        </div>
                    </div>

                    {/* Video Notes */}
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">Video Notes</label>
                        <textarea
                            name="notes"
                            defaultValue={video.notes || ''}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm"
                            rows={3}
                            placeholder="Add video notes..."
                            onChange={handleFieldChange}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                    <button
                        type="button"
                        onClick={handleCancelClick}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <SubmitButton
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        pendingText="Saving..."
                        disabled={!isDirty}
                    >
                        Save Changes
                    </SubmitButton>
                </div>
            </form>

            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={onCancel}
                title="Unsaved Changes"
                description="You have unsaved changes. Discard?"
                variant="warning"
                confirmText="Discard"
            />
        </>
    );
}
