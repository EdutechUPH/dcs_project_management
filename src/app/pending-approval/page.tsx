"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PendingApprovalPage() {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 text-center bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                <div className="flex justify-center">
                    <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-10 w-10 text-yellow-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                    Account Pending Approval
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Your account has been created but requires administrator approval before you can access the dashboard.
                </p>
                <p className="text-sm text-gray-500">
                    Please contact your administrator or wait for them to review your request.
                </p>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
}
