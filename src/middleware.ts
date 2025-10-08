// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const { data: { session } } = await supabase.auth.getSession();

  const publicRoutes = ['/login', '/auth/callback'];
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  if (!session && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (session && isAdminRoute) {
    // We only need the 'profile' data, so we can ignore the 'error'
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'Admin') {
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