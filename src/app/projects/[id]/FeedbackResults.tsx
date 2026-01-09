'use client';

import { Star, MessageSquare } from 'lucide-react';
import { type FeedbackSubmission } from '@/lib/types';

type FeedbackResultsProps = {
    feedback: any; // We'll cast to the specific shape we need
};

export default function FeedbackResults({ feedback }: FeedbackResultsProps) {
    if (!feedback) return null;

    // Ensure we have ratings to show (if submitted_at is null, usually no ratings)
    if (!feedback.submitted_at) return null;

    const ratings = [
        { label: 'Pre-Production', value: feedback.rating_pre_production },
        { label: 'Communication', value: feedback.rating_communication },
        { label: 'Quality', value: feedback.rating_quality },
        { label: 'Timeliness', value: feedback.rating_timeliness },
        { label: 'Final Product', value: feedback.rating_final_product },
        { label: 'Recommendation', value: feedback.rating_recommendation },
    ];

    const renderStars = (value: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                    <Star className="w-5 h-5 fill-blue-900 text-blue-900" />
                    Lecturer Feedback Results
                </h3>
                <span className="text-xs text-blue-600 font-medium">
                    Submitted {new Date(feedback.submitted_at).toLocaleDateString()}
                </span>
            </div>

            <div className="p-4 space-y-6">
                {/* Ratings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ratings.map((item) => (
                        <div key={item.label} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                            {renderStars(item.value || 0)}
                        </div>
                    ))}
                </div>

                {/* Comments Section */}
                {(feedback.improvement_aspects || feedback.overall_experience_comments) && (
                    <div className="space-y-4 pt-4 border-t">
                        {feedback.needs_improvement && feedback.improvement_aspects && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
                                    <MessageSquare className="w-4 h-4 text-red-500" />
                                    Areas for Improvement
                                </h4>
                                <p className="text-sm text-gray-600 italic bg-red-50 p-3 rounded border border-red-100">
                                    "{feedback.improvement_aspects}"
                                </p>
                            </div>
                        )}

                        {feedback.overall_experience_comments && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
                                    <MessageSquare className="w-4 h-4 text-blue-500" />
                                    Overall Comments
                                </h4>
                                <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded border border-gray-100">
                                    "{feedback.overall_experience_comments}"
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
