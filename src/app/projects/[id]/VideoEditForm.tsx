'use client';

import { useActionState, useRef, useEffect, useState } from 'react';
import { updateVideo } from './actions';
import { type Video, type Profile } from '@/lib/types';
import { useDebouncedCallback } from 'use-debounce';
import { Check, Loader2, AlertCircle } from 'lucide-react';

type VideoEditFormProps = {
    video: Video;
    projectId: number;
    profiles: Profile[];
    projectMainEditorId: string | null;
    onCancel: () => void;
};

const videoStatuses = ['Requested', 'Scheduled for Taping', 'Audio Editing', 'Video Editing', 'Review', 'Done'];
const languageOptions = ['Indonesian', 'English', 'Others'];

const initialState = { message: '', error: '' }; // Matches backend return type style roughly

export default function VideoEditForm({ video, projectId, profiles, projectMainEditorId, onCancel }: VideoEditFormProps) {
    const [state, action, isPending] = useActionState(updateVideo, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const [showSaved, setShowSaved] = useState(false);

    // Auto-save debouncer
    const debouncedSubmit = useDebouncedCallback(() => {
        formRef.current?.requestSubmit();
    }, 1000);

    // Handle changes in the form (debounced for text inputs)
    const handleChange = () => {
        setShowSaved(false);
        debouncedSubmit();
    };

    // Handle immediate changes (for selects/checkboxes)
    const handleImmediateChange = () => {
        setShowSaved(false);
        formRef.current?.requestSubmit();
    };

    // Show "Saved" message when pending finishes and we have a success message (or just no error)
    // Since we don't have a rigid "success" flag from the action yet (just message), we infer success if !error.
    useEffect(() => {
        if (!isPending && state?.message) {
            setShowSaved(true);
            const timer = setTimeout(() => setShowSaved(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isPending, state]);

    return (
        <form
            key={JSON.stringify(video)}
            action={action}
            ref={formRef}
            className="space-y-4 border rounded-lg p-4 bg-blue-50/50"
        >
            <input type="hidden" name="videoId" value={video.id} />
            <input type="hidden" name="projectId" value={projectId} />

            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Editing Video Details</h3>
                <div className="flex items-center gap-2 text-sm h-6">
                    {isPending && (
                        <span className="text-blue-600 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                        </span>
                    )}
                    {!isPending && showSaved && (
                        <span className="text-green-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Saved
                        </span>
                    )}
                </div>
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
                        onChange={handleChange}
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="text-sm font-medium">Status</label>
                    <select
                        name="status"
                        defaultValue={video.status}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        onChange={handleImmediateChange}
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
                        onChange={handleImmediateChange}
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
                        onChange={handleImmediateChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
                    />
                    <input
                        type="number"
                        name="duration_seconds"
                        placeholder="Secs"
                        defaultValue={video.duration_seconds || ''}
                        className="block w-20 rounded-md border-gray-300 shadow-sm p-2"
                        onChange={handleChange}
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
                            onChange={handleImmediateChange}
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
                            onChange={handleImmediateChange}
                        />
                        <label htmlFor={`ind-sub-${video.id}`} className="text-sm">Indonesian Subtitles</label>
                    </div>
                </div>

                {/* Internal Notes */}
                <div className="md:col-span-2">
                    <label className="text-sm font-medium">Internal Notes</label>
                    <textarea
                        name="notes"
                        defaultValue={video.notes || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm"
                        rows={3}
                        placeholder="Add internal notes about this video..."
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                <span className="text-xs text-gray-400 self-center mr-auto">Changes save automatically</span>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                    Done
                </button>
            </div>
        </form>
    );
}
