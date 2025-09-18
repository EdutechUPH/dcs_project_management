// src/app/projects/[id]/FeedbackManager.tsx
'use client';

import { useState, useTransition, useEffect } from 'react'; // Import useEffect
import { requestFeedback } from './actions';

type FeedbackManagerProps = {
  projectId: number;
  initialUuid: string | null;
};

export default function FeedbackManager({ projectId, initialUuid }: FeedbackManagerProps) {
  const [uuid, setUuid] = useState(initialUuid);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // NEW: State to hold the fully constructed link
  const [feedbackLink, setFeedbackLink] = useState('');

  // NEW: useEffect to safely build the link on the client-side
  useEffect(() => {
    if (uuid) {
      // This code will only run in the browser where 'window' exists
      setFeedbackLink(`${window.location.origin}/feedback/${uuid}`);
    }
  }, [uuid]); // This runs whenever the 'uuid' state changes

  const handleRequestFeedback = () => {
    setError('');
    startTransition(async () => {
      const result = await requestFeedback(projectId);
      if (result.error) {
        setError(result.error);
      } else if (result.uuid) {
        setUuid(result.uuid);
      }
    });
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Lecturer Feedback</h2>
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