// src/app/feedback/[uuid]/page.tsx
'use client';

import { useActionState } from 'react';
import { submitFeedback } from './actions';
import SubmitButton from '@/components/SubmitButton';
import { type Project } from '@/lib/types';

const RatingInput = ({ question, name }: { question: string, name: string }) => (
  <div className="mb-6">
    <label className="block text-md font-medium text-gray-800 mb-3">{question}</label>
    <div className="flex justify-between items-center text-sm text-gray-500">
      <span>Strongly Disagree</span>
      <span>Strongly Agree</span>
    </div>
    <div className="flex justify-center space-x-2 sm:space-x-4 mt-2">
      {[1, 2, 3, 4, 5].map(value => (
        <div key={value} className="flex flex-col items-center">
          <input
            type="radio"
            name={name}
            value={value}
            required
            className="h-5 w-5 accent-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <label className="mt-1 text-sm">{value}</label>
        </div>
      ))}
    </div>
  </div>
);

export default function FeedbackPage({ project, submissionUuid }: { project: Project, submissionUuid: string }) {

  const submitFeedbackWithUuid = submitFeedback.bind(null, submissionUuid);
  const [state, formAction] = useActionState(submitFeedbackWithUuid, { message: '' });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-gray-900">Feedback Request</h1>
          <p className="mt-2 text-lg text-gray-600">
            For the course: <span className="font-semibold">{project.course_name}</span>
          </p>
          <p className="mt-1 text-md text-gray-500">
            Taught by: {project.lecturers?.name}
          </p>

          <form action={formAction} className="mt-10 space-y-8">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Satisfaction Survey</h2>
            <p className="text-sm text-gray-600">Please rate your satisfaction on a scale of 1 (Strongly Disagree) to 5 (Strongly Agree).</p>
            
            <RatingInput question="The pre-production process (consultation, syllabus review) was clear and helpful." name="rating_pre_production" />
            <RatingInput question="Communication with the Digital Content Specialist team was effective." name="rating_communication" />
            <RatingInput question="The quality of the raw video/audio footage was satisfactory." name="rating_quality" />
            <RatingInput question="The project was completed in a timely manner." name="rating_timeliness" />
            <RatingInput question="I am satisfied with the final edited video product." name="rating_final_product" />
            <RatingInput question="I would recommend this video production service to my colleagues." name="rating_recommendation" />

            <div>
              <label className="block text-md font-medium text-gray-800">Is there any aspect of our service that needs improvement?</label>
              <div className="mt-2 flex space-x-4">
                <label className="flex items-center">
                  <input type="radio" name="needs_improvement" value="Yes" className="h-4 w-4 accent-blue-600"/>
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="needs_improvement" value="No" className="h-4 w-4 accent-blue-600"/>
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="improvement_aspects" className="block text-md font-medium text-gray-800">If yes, what aspects need improvement?</label>
              <textarea name="improvement_aspects" id="improvement_aspects" rows={3} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2"></textarea>
            </div>

            <div>
              <label htmlFor="overall_experience_comments" className="block text-md font-medium text-gray-800">Do you have any other comments about your overall experience?</label>
              <textarea name="overall_experience_comments" id="overall_experience_comments" rows={3} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2"></textarea>
            </div>

            <div className="pt-5 border-t">
              <div className="flex justify-end gap-4 items-center">
                {state?.message && <p className="text-sm text-red-500">{state.message}</p>}
                <SubmitButton 
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-400" 
                  pendingText="Submitting..."
                >
                  Submit Feedback
                </SubmitButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}