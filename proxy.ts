import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { clerkMiddleware } from "@clerk/nextjs/server";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "janic_super_secret_session_jwt_key_2026_xYz987!@"
);

const SESSION_COOKIE_NAME = "janic_auth_token";

// Behind nginx, request.url points to the internal address (localhost:3002).
// Build redirect URLs from the real public domain instead.
function getPublicOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (configured && /^https?:\/\//.test(configured) && !configured.includes("localhost")) {
    return configured;
  }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host && !host.startsWith("localhost")) {
    return `${proto}://${host}`;
  }
  return request.nextUrl.origin;
}

function toPublicUrl(path: string, request: NextRequest): URL {
  return new URL(path, getPublicOrigin(request));
}

const handler = clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Protect /admin and /staff routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    let isAuthenticated = false;
    let userRole = null;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        if (payload?.id) {
          isAuthenticated = true;
          userRole = payload.role;
        }
      } catch {
        isAuthenticated = false;
      }
    }

    // For all protected routes, must be authenticated
    if (!isAuthenticated) {
      const loginUrl = toPublicUrl("/login", request);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Regular USER (public account) cannot access /admin or /staff portals
    if (userRole === "USER") {
      return NextResponse.redirect(toPublicUrl("/", request));
    }

    // If STAFF tries to access /admin/..., redirect to /staff/...
    if (userRole === "STAFF" && pathname.startsWith("/admin")) {
      const staffPath = pathname.replace(/^\/admin/, "/staff");
      return NextResponse.redirect(toPublicUrl(staffPath, request));
    }
  }

  // If user is accessing /login while already authenticated
  if (pathname === "/login") {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        if (payload?.id) {
          const dest =
            payload.role === "STAFF"
              ? "/staff/dashboard"
              : payload.role === "ADMIN" || payload.role === "EDITOR"
              ? "/admin/dashboard"
              : "/";
          return NextResponse.redirect(toPublicUrl(dest, request));
        }
      } catch {
        // invalid token, proceed to login
      }
    }
  }

  return NextResponse.next();
});

export default handler;
export const proxy = handler;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
