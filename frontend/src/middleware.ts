import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow unauthenticated access to login, signup, and static files
  if (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Redirect root to /login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check for auth token
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}