// src/app/projects/[id]/FeedbackManager.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { requestFeedback } from './actions';

type FeedbackManagerProps = {
  projectId: number;
  feedbackSubmission: {
    submission_uuid: string;
    submitted_at: string | null;
    slug?: string | null;
  } | null;
};

export default function FeedbackManager({ projectId, feedbackSubmission }: FeedbackManagerProps) {
  const [uuid, setUuid] = useState(feedbackSubmission?.submission_uuid || null);
  const [slug, setSlug] = useState(feedbackSubmission?.slug || null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [feedbackLink, setFeedbackLink] = useState('');

  useEffect(() => {
    if (slug) {
      setFeedbackLink(`${window.location.origin}/feedback/${slug}`);
    } else if (uuid) {
      // Fallback for old links
      setFeedbackLink(`${window.location.origin}/feedback/${uuid}`);
    }
  }, [uuid, slug]);

  const handleRequestFeedback = () => {
    setError('');
    startTransition(async () => {
      const result = await requestFeedback(projectId);
      if (result.error) {
        setError(result.error);
      } else {
        if (result.uuid) setUuid(result.uuid);
        if (result.slug) setSlug(result.slug);
      }
    });
  };

  const isSubmitted = !!feedbackSubmission?.submitted_at;

  return (
    <div className="mt-8 lg:mt-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Lecturer Feedback</h2>
        {uuid && (
          isSubmitted ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Received</span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Pending</span>
          )
        )}
      </div>
      <div className="p-6 border rounded-lg bg-white">
        {feedbackLink ? (
          <div>
            <p className="text-sm font-medium text-gray-700">Share this secure link with the lecturer:</p>
            <input
              type="text"
              readOnly
              value={feedbackLink}
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm p-2"
            />
            <button
              onClick={() => navigator.clipboard.writeText(feedbackLink)}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Copy Link
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-2">Generate a unique link to request feedback for this project.</p>
            <button
              onClick={handleRequestFeedback}
              disabled={isPending}
              className="bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700 disabled:bg-gray-400"
            >
              {isPending ? 'Generating...' : 'Generate Feedback Link'}
            </button>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}