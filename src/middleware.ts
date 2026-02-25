import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Public routes accessible without authentication
const PUBLIC_ROUTES = ["/", "/login"];

export default auth((req) => {
    const { nextUrl, auth: session } = req;
    const isLoggedIn = !!session?.user;
    const isAuthPage = nextUrl.pathname.startsWith("/login");
    const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
    const isPublic = PUBLIC_ROUTES.includes(nextUrl.pathname);

    // Allow auth API routes
    if (isApiAuth) return NextResponse.next();

    // Allow public routes (landing page, login)
    if (isPublic && !isLoggedIn) return NextResponse.next();

    // Redirect to dashboard if already authenticated and on login or landing
    if (isLoggedIn && (isAuthPage || nextUrl.pathname === "/")) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Redirect to login if not authenticated on protected routes
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
