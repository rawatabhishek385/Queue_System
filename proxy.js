import { NextResponse } from 'next/server';

export default async function proxy(request) {
  const url = request.nextUrl.clone();
  
  if (url.pathname.startsWith('/admin') && !url.pathname.includes('/login')) {
    const authCookie = request.cookies.get('admin_auth');
    if (!authCookie || authCookie.value !== 'authenticated') {
      url.pathname = url.pathname.replace(/\/$/, '') + '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
