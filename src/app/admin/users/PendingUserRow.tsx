"use client";

import { useState } from 'react';
import { Profile } from '@/lib/types';
import { approveUser, rejectUser } from './actions';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PendingUserRow({ profile }: { profile: Profile }) {
    const [loading, setLoading] = useState(false);

    const handleApprove = async (role: string) => {
        setLoading(true);
        const res = await approveUser(profile.id, role);
        if (res?.error) toast.error(res.error);
        else toast.success(`User approved as ${role}`);
        setLoading(false);
    };

    const handleReject = async () => {
        if (!confirm("Reject and remove this user request?")) return;
        setLoading(true);
        const res = await rejectUser(profile.id);
        if (res?.error) toast.error(res.error);
        else toast.success("User request rejected.");
        setLoading(false);
    };

    return (
        <tr className="bg-yellow-50/50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
                            {profile.full_name?.charAt(0) || '?'}
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{profile.full_name}</div>
                        <div className="text-sm text-gray-500">{profile.email || "No email"}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending Approval
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {loading ? <Loader2 className="w-4 h-4 animate-spin ml-auto" /> : (
                    <div className="flex justify-end gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1">
                                    <Check className="w-4 h-4" /> Approve
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleApprove('Instructional Designer')}>
                                    As Instructional Designer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleApprove('Digital Content Specialist')}>
                                    As Digital Content Specialist
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleApprove('Admin')}>
                                    As Admin
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button size="sm" variant="destructive" onClick={handleReject} className="gap-1">
                            <X className="w-4 h-4" /> Reject
                        </Button>
                    </div>
                )}
            </td>
        </tr>
    );
}
