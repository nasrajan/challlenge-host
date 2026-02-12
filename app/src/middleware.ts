import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/setup-admin",
];

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Allow public paths immediately
        if (publicPaths.includes(path)) {
            return NextResponse.next();
        }

        // Redirect authenticated users away from auth pages
        if (token && (path === "/login" || path === "/register")) {
            const redirectUrl = token.role === "ADMIN" ? "/admin" : "/dashboard";
            return NextResponse.redirect(new URL(redirectUrl, req.url));
        }

        // Admin route protection
        if (path.startsWith("/admin") && token?.role !== "ADMIN") {
            const organizerEditPath = /^\/admin\/challenges\/[^/]+\/edit$/;
            if (token?.role === "ORGANIZER" && organizerEditPath.test(path)) {
                return NextResponse.next();
            }
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        // ✅ CRITICAL: always allow request to continue
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const path = req.nextUrl.pathname;

                // Public paths do not require auth
                if (publicPaths.includes(path)) {
                    return true;
                }

                // Everything else requires a token
                return !!token;
            },
        },
        pages: {
            signIn: "/login", // 👈 prevents default /api/auth/signin loop
        },
    }
);

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
