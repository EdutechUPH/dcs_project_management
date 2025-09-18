// src/app/feedback/[uuid]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { submitFeedback } from './actions';
import SubmitButton from '@/components/SubmitButton';
import FeedbackForm from './FeedbackForm';

export default async function FeedbackPage({ params }: { params: { uuid: string } }) {
  const supabase = createClient();
  const submissionUuid = params.uuid;

  const { data: submission, error } = await supabase
    .from('feedback_submission')
    .select(`
      submitted_at,
      projects (
        course_name,
        lecturers ( name ),
        videos ( title )
      )
    `)
    .eq('submission_uuid', submissionUuid)
    .single();

  if (error || !submission) {
    notFound();
  }

  if (submission.submitted_at) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800">Thank You!</h1>
          <p className="mt-2 text-gray-600">Feedback for this project has already been submitted.</p>
        </div>
      </div>
    );
  }

  const project = submission.projects;

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-md">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Video Production Feedback</h1>
          <p className="mt-2 text-gray-600">
            Thank you for taking the time to provide feedback for the project: 
            <span className="font-semibold"> {project?.course_name}</span> by <span className="font-semibold">{project?.lecturers?.name}</span>.
          </p>
          <h3 className="text-lg font-semibold mt-4">Videos in this project:</h3>
          <ul className="list-disc pl-5 mt-2 text-gray-500">
            {project?.videos.map((video: any) => <li key={video.title}>{video.title}</li>)}
          </ul>
        </div>
        <FeedbackForm submissionUuid={submissionUuid} />
      </div>
    </div>
  );
}