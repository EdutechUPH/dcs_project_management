// src/app/projects/[id]/VideoList.tsx
'use client';

import { addVideoToProject, deleteVideo, updateVideo } from './actions';
import SubmitButton from '@/components/SubmitButton';
import { useRef } from 'react';

type VideoListProps = {
  videos: any[];
  projectId: number;
};

const videoStatuses = ['Requested', 'Scheduled for Taping', 'Audio Editing', 'Video Editing', 'Review', 'Done'];

export default function VideoList({ videos, projectId }: VideoListProps) {
  const addVideoWithId = addVideoToProject.bind(null, projectId);
  const formRef = useRef<HTMLFormElement>(null);

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
            // The outer container for each video is now just a div
            <div key={video.id} className="p-4 border rounded-lg bg-white space-y-4">
              {/* Form for UPDATING the video */}
              <form action={updateVideo}>
                <input type="hidden" name="videoId" value={video.id} />
                <input type="hidden" name="projectId" value={projectId} />

                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <label className="text-sm font-medium text-gray-500">Title</label>
                    <input type="text" name="title" defaultValue={video.title} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" required />
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <select name="status" defaultValue={video.status} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                      {videoStatuses.map(status => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Language</label>
                    <input type="text" name="language" defaultValue={video.language} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Video Link</label>
                    <input type="text" name="video_link" defaultValue={video.video_link} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                  </div>
                  <div className="flex items-end pb-2 gap-4 col-span-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" name="has_english_subtitle" id={`eng-sub-${video.id}`} defaultChecked={video.has_english_subtitle} className="h-4 w-4 rounded border-gray-300" />
                        <label htmlFor={`eng-sub-${video.id}`} className="text-sm text-gray-700">English Subtitles</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" name="has_indonesian_subtitle" id={`ind-sub-${video.id}`} defaultChecked={video.has_indonesian_subtitle} className="h-4 w-4 rounded border-gray-300" />
                        <label htmlFor={`ind-sub-${video.id}`} className="text-sm text-gray-700">Indonesian Subtitles</label>
                      </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div className="flex items-end gap-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mins</label>
                      <input type="number" name="duration_minutes" defaultValue={video.duration_minutes} className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm p-2" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Secs</label>
                      <input type="number" name="duration_seconds" defaultValue={video.duration_seconds} className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm p-2" />
                    </div>
                  </div>
                  {/* The save button is part of the update form */}
                  <SubmitButton className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400" pendingText="Saving...">Save</SubmitButton>
                </div>
              </form>

              {/* The delete button is now in its own, separate form */}
              <div className="flex justify-end">
                <form action={deleteVideo} onSubmit={(e) => { if (!confirm('Are you sure?')) e.preventDefault(); }}>
                  <input type="hidden" name="videoId" value={video.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">Delete this video</button>
                </form>
              </div>

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