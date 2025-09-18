// src/app/feedback/thank-you/page.tsx
import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-10 bg-white rounded-lg shadow-xl text-center">
        <h1 className="text-3xl font-bold text-gray-800">Thank You!</h1>
        <p className="mt-3 text-gray-600">Your feedback has been successfully submitted.</p>
        <p className="mt-1 text-gray-600">We appreciate you taking the time to help us improve.</p>
      </div>
    </div>
  );
}