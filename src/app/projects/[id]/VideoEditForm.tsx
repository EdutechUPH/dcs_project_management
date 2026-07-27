'use client';

import { useActionState, useRef, useEffect, useState } from 'react';
import { updateVideo } from './actions';
import { type Video, type Profile } from '@/lib/types';
import { groupedProfiles } from '@/lib/roles';
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
    const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false);

    // Editing credit is read from this video's own editor (AI_README §8), so a change here
    // silently moves who gets credited for it. Tracked in state to warn before saving.
    const [editorId, setEditorId] = useState(video.main_editor_id || projectMainEditorId || '');
    const [showEditorConfirm, setShowEditorConfirm] = useState(false);

    const nameOf = (id: string) => profiles.find(p => p.id === id)?.full_name ?? 'Unassigned';
    const originalEditorId = video.main_editor_id || projectMainEditorId || '';
    const editorChanged = editorId !== originalEditorId;
    const divergesFromProject = Boolean(projectMainEditorId) && editorId !== projectMainEditorId;

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
                onSubmit={event => {
                    // Only a change of editor needs confirming; every other field is harmless.
                    if (editorChanged && !showEditorConfirm) {
                        event.preventDefault();
                        setShowEditorConfirm(true);
                    }
                }}
                className="space-y-4 border rounded-lg p-4 bg-blue-50/50"
            >
                <input type="hidden" name="videoId" value={video.id} />
                <input type="hidden" name="projectId" value={projectId} />

                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700">Editing Video Details</h3>
                    {isDirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
                </div>

                {/* Feedback Alert in Edit Mode */}
                {video.revision_notes && video.status !== 'Done' && (() => {
                    const isLong = video.revision_notes.length > 200;
                    const text = isLong && !isFeedbackExpanded 
                      ? video.revision_notes.slice(0, 200) + '...' 
                      : video.revision_notes;
                    return (
                        <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                            <div className="flex-grow min-w-0">
                                <span className="font-semibold block mb-1">Lecturer Feedback:</span>
                                <div className="whitespace-pre-wrap break-words">{text}</div>
                                {isLong && (
                                    <button
                                        type="button"
                                        onClick={() => setIsFeedbackExpanded(!isFeedbackExpanded)}
                                        className="text-xs text-amber-800 hover:text-amber-950 font-semibold mt-1.5 underline decoration-dotted"
                                    >
                                        {isFeedbackExpanded ? "Show Less" : "Show More"}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })()}

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

                    {/* Per-video Due Date */}
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">
                            Video Due Date
                            <span className="text-gray-500 font-normal ml-1">(optional)</span>
                        </label>
                        <input
                            type="date"
                            name="due_date"
                            defaultValue={video.due_date || ''}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                            onChange={handleFieldChange}
                        />
                        <p className="text-xs text-gray-500 mt-0.5">
                            Leave empty to use the project due date. Set this for classes that need videos
                            delivered on a weekly or staggered schedule.
                        </p>
                    </div>

                    {/* Main Editor */}
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">Main Editor</label>
                        <select
                            name="main_editor_id"
                            value={editorId}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                            onChange={e => {
                                setEditorId(e.target.value);
                                handleFieldChange();
                            }}
                        >
                            <option value="">Unassigned</option>
                            {/* Grouped by role and sorted, matching every other member
                                dropdown. This one was a flat unsorted list, which is a poor
                                fit for the field that decides who analytics credits (§8). A
                                native select cannot take the role colours, but the grouping
                                and ordering are what make a name findable. */}
                            {groupedProfiles(profiles).map(group => (
                                <optgroup key={group.label} label={group.label}>
                                    {group.profiles.map(profile => (
                                        <option key={profile.id} value={profile.id}>
                                            {profile.full_name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {/* Says plainly where the credit lands, since the field looks the same whether
                            the value is this video's own or inherited from the project. */}
                        {divergesFromProject ? (
                            <p className="mt-1 text-xs text-amber-700">
                                Overrides the project&rsquo;s main editor ({nameOf(projectMainEditorId!)}).
                                This video will be credited to{' '}
                                {editorId ? nameOf(editorId) : 'nobody'} in analytics.
                            </p>
                        ) : (
                            <p className="mt-1 text-xs text-gray-500">
                                Matches the project&rsquo;s main editor. Change it only if someone else
                                edited this particular video.
                            </p>
                        )}
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

            <ConfirmationModal
                isOpen={showEditorConfirm}
                onClose={() => setShowEditorConfirm(false)}
                onConfirm={() => {
                    // showEditorConfirm is still true here, so the onSubmit guard lets it through.
                    formRef.current?.requestSubmit();
                }}
                title="Change who is credited for this video?"
                variant="warning"
                confirmText="Save change"
                description={
                    <>
                        <p>
                            Editing credit in analytics comes from each video individually, so this
                            changes the Editor Scorecard, runtime totals and on-time figures for both
                            people.
                        </p>
                        <p className="rounded-lg bg-gray-50 p-3 text-gray-700">
                            <span className="font-medium text-gray-900">{video.title}</span> moves from{' '}
                            <span className="font-medium text-gray-900">
                                {originalEditorId ? nameOf(originalEditorId) : 'nobody'}
                            </span>{' '}
                            to{' '}
                            <span className="font-medium text-gray-900">
                                {editorId ? nameOf(editorId) : 'nobody'}
                            </span>
                            .
                        </p>
                        {!editorId && (
                            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
                                With no editor set, this video is credited to nobody at all and drops out
                                of every per-editor metric.
                            </p>
                        )}
                    </>
                }
            />
        </>
    );
}
