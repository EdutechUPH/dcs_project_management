// src/components/SubmitButton.tsx
'use client';


import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  disabled?: boolean;
}

export default function SubmitButton({ children, className, pendingText, disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={className}
    >
      {pending ? pendingText || 'Submitting...' : children}
    </button>
  );
}
