// src/app/onboarding/page.tsx
'use client';

import { useActionState } from 'react';
import { completeProfile } from './actions';
import SubmitButton from '@/components/SubmitButton';

const initialState = { message: '' };
const userRoles = ['Instructional Designer', 'Digital Content Specialist'];

export default function OnboardingPage() {
  const [state, formAction] = useActionState(completeProfile, initialState);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
        <p className="text-gray-600 mb-6">Welcome! Please tell us a bit more about yourself.</p>
        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              name="full_name" 
              id="full_name" 
              required 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Your Role</label>
            <select 
              name="role" 
              id="role" 
              required 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            >
              <option value="">Select your role...</option>
              {userRoles.map(role => <option key={role}>{role}</option>)}
            </select>
          </div>
          <div className="pt-2">
            <SubmitButton 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:bg-gray-400"
              pendingText="Saving..."
            >
              Save and Continue
            </SubmitButton>
            {state?.message && <p className="text-sm text-red-500 mt-2 text-center">{state.message}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}