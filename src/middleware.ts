import { NextRequest, NextResponse } from "next/server";

// Public routes accessible without authentication
const PUBLIC_ROUTES = ["/", "/login"];

export function middleware(req: NextRequest) {
    const { nextUrl, cookies } = req;

    const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
    const isPublic = PUBLIC_ROUTES.includes(nextUrl.pathname);

    // Always allow auth API routes
    if (isApiAuth) return NextResponse.next();

    // Check for NextAuth JWT session cookie (works in both dev and prod)
    const sessionCookie =
        cookies.get("next-auth.session-token") ||
        cookies.get("__Secure-next-auth.session-token") ||
        cookies.get("authjs.session-token") ||
        cookies.get("__Secure-authjs.session-token");
    const isLoggedIn = !!sessionCookie;

    // Allow public routes for unauthenticated users
    if (isPublic && !isLoggedIn) return NextResponse.next();

    // Redirect to dashboard if already authenticated and on landing or login
    if (isLoggedIn && isPublic) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Redirect to login if not authenticated on protected routes
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
