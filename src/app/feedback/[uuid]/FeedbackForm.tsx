// src/app/feedback/[uuid]/FeedbackForm.tsx
'use client';

import { useActionState } from 'react';
import { submitFeedback } from './actions';
import SubmitButton from '@/components/SubmitButton';

const initialState = { message: '' };

const RatingQuestion = ({ number, question, name }: { number: number; question: string, name: string }) => (
  <div className="py-4">
    <p className="font-medium text-gray-800">{number}. {question}</p>
    <div className="flex justify-around mt-2">
      {[1, 2, 3, 4, 5].map(val => (
        <label key={val} className="flex flex-col items-center text-sm text-gray-600">
          <input type="radio" name={name} value={val} className="h-4 w-4" required />
          {val}
        </label>
      ))}
    </div>
  </div>
);

export default function FeedbackForm({ submissionUuid }: { submissionUuid: string }) {
  const submitFeedbackWithId = submitFeedback.bind(null, submissionUuid);
  const [state, formAction] = useActionState(submitFeedbackWithId, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <p className="text-sm text-gray-600">Please provide a score from 1 (lowest) to 5 (highest).</p>

      <RatingQuestion number={1} question="How satisfied are you with the pre-production process (planning, initial coordination)?" name="rating_pre_production" />
      <RatingQuestion number={2} question="How satisfied are you with the communication and support from the team during the production process?" name="rating_communication" />
      <RatingQuestion number={3} question="How satisfied are you with the video quality (audio, visuals, editing)?" name="rating_quality" />
      <RatingQuestion number={4} question="How satisfied are you with the speed of video production completion?" name="rating_timeliness" />
      <RatingQuestion number={5} question="How satisfied are you with the final video result?" name="rating_final_product" />
      <RatingQuestion number={6} question="How likely are you to recommend our video production services to other lecturers?" name="rating_recommendation" />

      <div className="py-4">
        <p className="font-medium text-gray-800">7. Are there any service aspects that you think need improvement?</p>
        <div className="flex gap-4 mt-2">
          <label><input type="radio" name="needs_improvement" value="Yes" className="mr-2"/>Yes</label>
          <label><input type="radio" name="needs_improvement" value="No" className="mr-2"/>No</label>
        </div>
      </div>

      <div>
        <label className="font-medium text-gray-800">8. Aspects that need improvement (if any)</label>
        <textarea name="improvement_aspects" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"></textarea>
      </div>
      
      <div>
        <label className="font-medium text-gray-800">9. Overall, how was your experience with our video production services?</label>
        <textarea name="overall_experience_comments" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"></textarea>
      </div>

      <div className="flex justify-end items-center gap-4 pt-4 border-t">
        {state?.message && <p className="text-sm text-red-500">{state.message}</p>}
        <SubmitButton 
          className="px-6 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md shadow-sm hover:bg-gray-700 disabled:bg-gray-400"
          pendingText="Submitting..."
        >
          Submit Feedback
        </SubmitButton>
      </div>
    </form>
  );
}