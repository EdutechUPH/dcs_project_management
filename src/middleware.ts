// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  const publicRoutes = ['/login', '/auth/callback', '/feedback'];
  const isOnPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const isOnOnboarding = request.nextUrl.pathname.startsWith('/onboarding');

  // If user is not logged in and is trying to access a protected route, redirect to login
  if (!session && !isOnPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (session) {
    // Fetch profile for the logged-in user
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', session.user.id)
      .single();

    // If profile is incomplete and they are not on the onboarding page, redirect them.
    if (!profile?.full_name && !isOnOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Admin route protection
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    if (isAdminRoute && profile?.role !== 'Admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};