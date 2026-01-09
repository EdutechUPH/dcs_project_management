'use client';

import { useState, useTransition, useEffect } from 'react';
import { requestFeedback } from './actions';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { type Video } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LinkIcon, CheckCircle, RefreshCw, Star, MessageSquare } from 'lucide-react';

type FeedbackManagerProps = {
  projectId: number;
  feedbackSubmission: any;
  videos: Video[];
};

export default function FeedbackManager({ projectId, feedbackSubmission, videos }: FeedbackManagerProps) {
  const [uuid, setUuid] = useState(feedbackSubmission?.submission_uuid || null);
  const [slug, setSlug] = useState(feedbackSubmission?.slug || null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [feedbackLink, setFeedbackLink] = useState('');

  useEffect(() => {
    if (slug) {
      setFeedbackLink(`${window.location.origin}/feedback/${slug}`);
    } else if (uuid) {
      setFeedbackLink(`${window.location.origin}/feedback/${uuid}`);
    }
  }, [uuid, slug]);

  const handleRequestFeedback = () => {
    setError('');

    // --- Validation: Ensure all videos have links and duration ---
    const incompleteVideos = videos.filter(v =>
      !v.video_link ||
      ((v.duration_minutes || 0) === 0 && (v.duration_seconds || 0) === 0)
    );

    if (incompleteVideos.length > 0) {
      const titles = incompleteVideos.map(v => v.title).join(", ");
      const msg = `Cannot request feedback. The following videos are missing a link or duration: ${titles}`;
      toast.error(msg);
      setError(msg); // Optional: also show inline
      return;
    }

    startTransition(async () => {
      const result = await requestFeedback(projectId);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        if (result.uuid) setUuid(result.uuid);
        if (result.slug) setSlug(result.slug);
        toast.success("Feedback link generated!");
      }
    });
  };

  const copyToClipboard = () => {
    if (feedbackLink) {
      navigator.clipboard.writeText(feedbackLink);
      alert("Link copied to clipboard!");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-500">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} className={i < rating ? "" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  const isSubmitted = !!feedbackSubmission?.submitted_at;

  if (isSubmitted) {
    return (
      <div className="mt-8 lg:mt-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Lecturer Feedback</h2>
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Received</span>
        </div>
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" />
              <CardTitle className="text-lg text-green-700">Feedback Submitted</CardTitle>
            </div>
            <CardDescription>
              Submitted on {new Date(feedbackSubmission.submitted_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(feedbackSubmission.rating_quality !== undefined) ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { l: 'Pre-Production', v: feedbackSubmission.rating_pre_production },
                    { l: 'Communication', v: feedbackSubmission.rating_communication },
                    { l: 'Quality', v: feedbackSubmission.rating_quality },
                    { l: 'Timeliness', v: feedbackSubmission.rating_timeliness },
                    { l: 'Final Product', v: feedbackSubmission.rating_final_product },
                    { l: 'Recommendation', v: feedbackSubmission.rating_recommendation },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between items-center bg-white/50 p-1.5 rounded">
                      <span className="text-gray-700">{r.l}</span>
                      {renderStars(r.v || 0)}
                    </div>
                  ))}
                </div>

                {feedbackSubmission.overall_experience_comments && (
                  <div className="mt-4 pt-3 border-t border-green-200">
                    <p className="font-semibold mb-1 flex items-center gap-2 text-green-800"><MessageSquare size={14} /> Comments</p>
                    <p className="text-gray-700 italic whitespace-pre-wrap text-sm leading-relaxed">"{feedbackSubmission.overall_experience_comments}"</p>
                  </div>
                )}

                {feedbackSubmission.needs_improvement && (
                  <div className="mt-2 bg-red-50 text-red-800 p-3 rounded text-xs border border-red-100">
                    <strong className="block mb-1">Needs Improvement:</strong>
                    <p className="whitespace-pre-wrap">{feedbackSubmission.improvement_aspects}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Feedback details unavailable. Please check database.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8 lg:mt-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Lecturer Feedback</h2>
        {uuid && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Pending</span>}
      </div>
      <div className="p-6 border rounded-lg bg-white">
        {feedbackLink ? (
          <div>
            <p className="text-sm font-medium text-gray-700">Share this secure link with the lecturer:</p>
            <input
              type="text"
              readOnly
              value={feedbackLink}
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm p-2 text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="mt-2 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 transition-colors"
            >
              Copy Link
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-2">Generate a unique link to request feedback for this project.</p>
            <Button
              onClick={handleRequestFeedback}
              disabled={isPending}
              className="w-full bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700 disabled:bg-gray-400"
            >
              {isPending ? 'Generating...' : 'Generate Feedback Link'}
            </Button>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}