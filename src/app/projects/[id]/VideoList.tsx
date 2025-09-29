// src/app/projects/[id]/VideoList.tsx
'use client';

import { addVideoToProject, deleteVideo, updateVideo } from './actions';
import SubmitButton from '@/components/SubmitButton';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { MAIN_EDITOR_ROLE } from '@/lib/constants';

type VideoListProps = {
  videos: any[];
  projectId: number;
  profiles: any[];
  assignments: any[];
};

const statusColors: { [key: string]: string } = {
  'Done': 'bg-green-100 text-green-800',
  'Review': 'bg-yellow-100 text-yellow-800',
  'Video Editing': 'bg-purple-100 text-purple-800',
  'Audio Editing': 'bg-pink-100 text-pink-800',
  'Scheduled for Taping': 'bg-indigo-100 text-indigo-800',
  'Requested': 'bg-gray-100 text-gray-800',
};

const videoStatuses = ['Requested', 'Scheduled for Taping', 'Audio Editing', 'Video Editing', 'Review', 'Done'];
const languageOptions = ['Indonesian', 'English', 'Others'];

export default function VideoList({ videos, projectId, profiles, assignments }: VideoListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const addVideoWithId = addVideoToProject.bind(null, projectId);
  const formRef = useRef<HTMLFormElement>(null);

  const projectMainEditor = assignments.find(a => a.role === MAIN_EDITOR_ROLE);
  const projectMainEditorId = projectMainEditor?.profile_id || null;

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
        {videos.length > 0 ? (
          videos.map((video: any) => (
            <div key={video.id} className="p-4 border rounded-lg bg-white">
              {editingId === video.id ? (
                <form action={updateVideo} onSubmit={() => setEditingId(null)} className="space-y-4">
                  <input type="hidden" name="videoId" value={video.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <input type="text" name="title" defaultValue={video.title} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <select name="status" defaultValue={video.status} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                        {videoStatuses.map(status => <option key={status}>{status}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Main Editor</label>
                      <select 
                        name="main_editor_id" 
                        defaultValue={video.main_editor_id || projectMainEditorId || ''} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                      >
                        <option value="">Unassigned</option>
                        {/* THE FIX IS HERE: We now map over all profiles */}
                        {profiles.map(profile => (
                          <option key={profile.id} value={profile.id}>{profile.full_name}</option>
                        ))}
                      </select>
                    </div>
                     <div>
                      <label className="text-sm font-medium">Language</label>
                      <select name="language" defaultValue={video.language || 'Indonesian'} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                        {languageOptions.map(lang => <option key={lang}>{lang}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Video Link</label>
                      <input type="text" name="video_link" defaultValue={video.video_link} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                    </div>
                     <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Duration:</label>
                        <input type="number" name="duration_minutes" placeholder="Mins" defaultValue={video.duration_minutes} className="block w-20 rounded-md border-gray-300 shadow-sm p-2" />
                        <input type="number" name="duration_seconds" placeholder="Secs" defaultValue={video.duration_seconds} className="block w-20 rounded-md border-gray-300 shadow-sm p-2" />
                    </div>
                     <div className="flex items-center gap-4 pt-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" name="has_english_subtitle" id={`eng-sub-${video.id}`} defaultChecked={video.has_english_subtitle} className="h-4 w-4 rounded border-gray-300" />
                          <label htmlFor={`eng-sub-${video.id}`} className="text-sm">English Subtitles</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" name="has_indonesian_subtitle" id={`ind-sub-${video.id}`} defaultChecked={video.has_indonesian_subtitle} className="h-4 w-4 rounded border-gray-300" />
                          <label htmlFor={`ind-sub-${video.id}`} className="text-sm">Indonesian Subtitles</label>
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" onClick={() => setEditingId(null)} className="text-sm font-medium text-gray-600">Cancel</button>
                    <SubmitButton className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400" pendingText="Saving...">Save</SubmitButton>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{video.title}</p>
                    <p className="text-sm text-gray-600">Duration: {video.duration_minutes || 0}m {video.duration_seconds || 0}s</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[video.status] || 'bg-gray-100 text-gray-800'}`}>
                      {video.status}
                    </span>
                    <button onClick={() => setEditingId(video.id)} className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">Edit</button>
                    <form action={deleteVideo} onSubmit={(e) => { if (!confirm('Are you sure?')) e.preventDefault(); }}>
                      <input type="hidden" name="videoId" value={video.id} />
                      <input type="hidden" name="projectId" value={projectId} />
                      <SubmitButton className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:bg-gray-100" pendingText="Deleting...">Delete</SubmitButton>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-4 border rounded-lg bg-white text-center text-gray-500">
            No videos have been added to this project yet.
          </div>
        )}
      </div>
    </div>
  );
}