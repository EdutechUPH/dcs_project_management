// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  const publicRoutes = ['/login', '/auth/callback', '/feedback'];
  const isOnPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const isOnOnboarding = request.nextUrl.pathname.startsWith('/onboarding');

  // If user is not logged in and is trying to access a protected route, redirect to login
  if (!user && !isOnPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    // Fetch profile for the logged-in user
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    const isPendingPage = request.nextUrl.pathname === '/pending-approval';

    // 1. PENDING APPROVAL CHECK
    // If user has no role (or is explicitly "Pending" if we had that status), block access.
    // Allow them to be on onboarding (to set name) or pending-approval page.
    if (!role && profile?.full_name && !isOnOnboarding && !isPendingPage) {
      return NextResponse.redirect(new URL('/pending-approval', request.url));
    }

    // If approved user tries to go to pending page, send them home
    if (role && isPendingPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. ONBOARDING CHECK
    // If profile is incomplete (no name), force onboarding.
    if (!profile?.full_name && !isOnOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // 3. ADMIN ROUTE PROTECTION
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isManageUsers = request.nextUrl.pathname.startsWith('/admin/users');

    if (isAdminRoute) {
      // "Manage Users" is strictly ADMIN only
      if (isManageUsers && role !== 'Admin') {
        // Redirect non-admins back to main admin dashboard (or home if they can't be there)
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      // Other /admin routes are visible to all approved staff (ID, DCS, Admin)
      // because we want them to use the dashboard, even if "Manage Users" is hidden UI-side.
      // However, if we wanted to block them from "Terms" etc we could do it here.
      // For now, consistent with plan: General Admin view is open.
      // BUT wait, "Faculties/Terms" are "Manage Content". Plan said: Admin/ID/DCS/Approved?
      // Let's stick to: Everyone can SEE /admin (dashboard), but specific sub-routes might need protection?
      // Plan says: "Manage Content (Faculties/Terms) -> Admin / ID / DCS"
      // So actually, ALL approved users can access /admin routes EXCEPT /admin/users.
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};