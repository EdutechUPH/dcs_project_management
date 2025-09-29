// src/components/UserStatus.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type User } from '@supabase/supabase-js';
import { signOut } from '@/app/auth/actions';
import Link from 'next/link';

type Profile = {
  role: string;
} | null;

export default function UserStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }
      setLoading(false);
    };

    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Fetch profile again on sign in
        supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data }) => {
          setProfile(data);
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  if (loading) {
    // Render a placeholder to prevent layout shift
    return <div className="w-64 h-8 animate-pulse bg-gray-700 rounded-md"></div>;
  }
  
  return (
    <div className="flex items-center gap-6">
      {user && (
        <>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-300 hover:text-white">Dashboard</Link>
            <Link href="/my-projects" className="text-sm text-gray-300 hover:text-white">My Projects</Link>
            <Link href="/workload" className="text-sm text-gray-300 hover:text-white">Workload</Link>
            <Link href="/analytics" className="text-sm text-gray-300 hover:text-white">Analytics</Link>
            {profile?.role === 'Admin' && (
              <Link href="/admin/faculties" className="text-sm text-gray-300 hover:text-white">Admin</Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/projects/new" className="text-sm bg-blue-600 hover:bg-blue-500 rounded-md px-3 py-1.5 font-semibold">
              New Request
            </Link>
            <span className="text-sm">{user.email}</span>
            <form action={signOut}>
              <button className="text-sm bg-gray-600 hover:bg-gray-500 rounded-md px-3 py-1">
                Sign Out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}