"use client"

import Link from 'next/link';
import { useState } from 'react';
import { Profile } from '@/lib/types';
import { updateUserRole, deleteUser } from '../actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2 } from 'lucide-react';

export function UserRow({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async (newRole: "Admin" | "Instructional Designer" | "Digital Content Specialist") => {
    setLoading(true);
    await updateUserRole(profile.id, newRole);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to remove this user? This cannot be undone.")) {
      setLoading(true);
      await deleteUser(profile.id);
      setLoading(false);
    }
  };

  const roleColors = {
    'Admin': 'bg-purple-100 text-purple-800',
    'Instructional Designer': 'bg-blue-100 text-blue-800',
    'Digital Content Specialist': 'bg-green-100 text-green-800',
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
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
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[profile.role] || 'bg-gray-100 text-gray-800'}`}>
          {profile.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {loading ? <Loader2 className="w-4 h-4 animate-spin ml-auto" /> : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href={`/admin/users/${profile.id}`}>
                  Edit Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Quick Role Change</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleRoleChange('Admin')}>
                Make Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleChange('Instructional Designer')}>
                Make Instructional Designer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleChange('Digital Content Specialist')}>
                Make DCS
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}