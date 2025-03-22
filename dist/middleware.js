"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
const server_1 = require("next/server");
function middleware(request) {
    const accessToken = request.cookies.get('access_token');
    const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
    const isProtectedApi = request.nextUrl.pathname.startsWith('/api/schedule');
    // If trying to access protected routes or APIs without auth, redirect to login or return 401
    if (!accessToken && (isProtectedApi || (!isAuthPage && !request.nextUrl.pathname.startsWith('/api')))) {
        if (isProtectedApi) {
            return server_1.NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        return server_1.NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // If trying to access auth pages while logged in, redirect to home
    if (accessToken && isAuthPage) {
        return server_1.NextResponse.redirect(new URL('/', request.url));
    }
    return server_1.NextResponse.next();
}
exports.config = {
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
