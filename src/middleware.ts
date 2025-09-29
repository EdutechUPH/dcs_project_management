// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  // Define public routes that don't require login
  const publicRoutes = ['/login', '/auth/callback'];
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  // If user is not logged in and is trying to access a protected route, redirect to login
  if (!session && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // --- NEW ROLE-BASED PROTECTION ---
  // If the user is logged in and trying to access an admin route...
  if (session && isAdminRoute) {
    // ...fetch their role from the profiles table.
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // If they are not an admin, redirect them to the dashboard.
    if (profile?.role !== 'Admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};