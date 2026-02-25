import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { nextUrl, auth: session } = req;
    const isLoggedIn = !!session?.user;
    const isAuthPage = nextUrl.pathname.startsWith("/login");
    const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
    const isApiRoute = nextUrl.pathname.startsWith("/api/");

    // Allow auth API routes
    if (isApiAuth) return NextResponse.next();

    // Redirect to login if not authenticated
    if (!isLoggedIn && !isAuthPage) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // Redirect to dashboard if already authenticated and on login page
    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Root redirect
    if (isLoggedIn && nextUrl.pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
