"use client"

import { useState } from 'react';
import { Profile } from '@/lib/types'; // Make sure this path is correct
import { updateProfile } from '../../actions'; // Adjust path to actions
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export function EditUserForm({ profile }: { profile: Profile }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setMessage(null);

        // We bind the ID to the server action separate from formData if needed, 
        // but here we call a wrapper or pass the ID differently?
        // simplest is to call the action directly.

        // Since we can't easily curry the ID in the form action attribute without .bind,
        // let's use a client-side handler calling the server action.

        const res = await updateProfile(profile.id, formData);
        if (res?.message) {
            // If there's a specific message (error or redirect fallback), show it
            // Note: the action redirects on success, so we might not see this unless it fails.
            setMessage(res.message);
        }
        setLoading(false);
    };

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={profile.full_name}
                    required
                    placeholder="e.g. John Doe"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={profile.email || ''}
                    placeholder="name@example.com"
                />
                <p className="text-xs text-gray-500">
                    Note: updating this here updates the contact record only, not their login email.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={profile.role}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Instructional Designer">Instructional Designer</SelectItem>
                        <SelectItem value="Digital Content Specialist">Digital Content Specialist</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {message && (
                <div className={`p-3 rounded-md text-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
