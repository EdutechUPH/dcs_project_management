// src/components/SubmitButton.tsx
'use client';

import { useFormStatus } from 'react-dom';

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string; // Allow custom styles
};

export default function SubmitButton({ children, pendingText, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      // Use the custom className, or a default if none is provided
      className={className || "bg-gray-800 text-white rounded-md shadow-sm py-2 px-4 hover:bg-gray-700 disabled:bg-gray-400"}
    >
      {pending ? (pendingText || 'Saving...') : children}
    </button>
  );
}