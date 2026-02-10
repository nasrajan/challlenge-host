import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/setup-admin"];

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Prevent redirect loops: if there's an error param on login, just let it render
        if (path === "/login" && req.nextUrl.searchParams.has("error")) {
            return NextResponse.next();
        }

        // Redirect authenticated users away from login/register pages
        if (token && (path === "/login" || path === "/register")) {
            const redirectUrl = token.role === "ADMIN" ? "/admin" : "/dashboard";
            return NextResponse.redirect(new URL(redirectUrl, req.url));
        }

        // Role-based protection for admin routes
        if (path.startsWith("/admin") && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const path = req.nextUrl.pathname;

                // Public paths
                if (publicPaths.some(p => path === p || path.startsWith(p + "/"))) {
                    return true;
                }

                // Require token for everything else
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes including auth)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
