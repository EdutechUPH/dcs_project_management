'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, History as HistoryIcon, X, MessageSquareQuote, CheckCircle } from 'lucide-react';
import { getVideoFeedbackHistory } from './actions';
import { type VideoFeedbackLog } from '@/lib/types';
import * as Dialog from '@radix-ui/react-dialog';

type VideoHistoryModalProps = {
    videoId: number;
    isOpen: boolean;
    onClose: () => void;
    videoTitle: string;
};

export default function VideoHistoryModal({ videoId, isOpen, onClose, videoTitle }: VideoHistoryModalProps) {
    const [history, setHistory] = useState<VideoFeedbackLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getVideoFeedbackHistory(videoId).then(data => {
                setHistory(data as VideoFeedbackLog[]);
                setLoading(false);
            });
        }
    }, [isOpen, videoId]);

    return (
        <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg">
                    <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                        <div className="flex justify-between items-center">
                            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
                                <HistoryIcon className="w-5 h-5" />
                                Revision History
                            </Dialog.Title>
                            <button onClick={onClose} className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>
                        <Dialog.Description className="text-sm text-muted-foreground text-gray-500">
                            Past feedback logs for '{videoTitle}'
                        </Dialog.Description>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                No revision history found.
                            </div>
                        ) : (
                            history.map((log) => {
                                const isApproved = log.status_context === 'Approved';
                                return (
                                    <div key={log.id} className="relative pl-6 pb-2 border-l-2 border-gray-200 last:border-0 last:pb-0">
                                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 mt-1 ${isApproved ? 'bg-green-100 border-green-500' : 'bg-white border-blue-500'}`}></div>
                                        <div className="text-xs text-gray-500 mb-1">
                                            {format(new Date(log.created_at), 'PPP p')}
                                        </div>
                                        <div className={`p-3 rounded-md text-sm relative group ${isApproved ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-700'}`}>
                                            {isApproved ? (
                                                <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-green-600" />
                                            ) : (
                                                <MessageSquareQuote className="absolute top-2 right-2 w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                                            )}
                                            {log.feedback_text}
                                        </div>
                                        {log.status_context && !isApproved && (
                                            <div className="mt-1">
                                                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-500 shadow-sm">
                                                    {log.status_context}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
