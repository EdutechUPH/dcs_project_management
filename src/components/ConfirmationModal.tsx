'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AlertCircle, X } from 'lucide-react';

type ConfirmationModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
};

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'warning'
}: ConfirmationModalProps) {

    return (
        <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg animate-in fade-in zoom-in-95">
                    <div className="flex flex-col space-y-2 text-center sm:text-left">
                        <div className="flex justify-between items-start">
                            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2 text-gray-900">
                                {variant === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                                {variant === 'danger' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                {title}
                            </Dialog.Title>
                            <button onClick={onClose} className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 p-1 hover:bg-gray-100">
                                <X className="h-4 w-4 text-gray-500" />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>
                        <Dialog.Description className="text-sm text-gray-500 leading-relaxed pt-2">
                            {description}
                        </Dialog.Description>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 
                                ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}
                                ${variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' : ''}
                                ${variant === 'info' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : ''}
                            `}
                        >
                            {confirmText}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
