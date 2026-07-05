import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const READ_ONLY_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname.startsWith("/login");
  const isApiAuthRoute = pathname.startsWith("/api/auth");

  if (isApiAuthRoute) return NextResponse.next();

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/orders", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Viewers are read-only: block non-GET mutations to app routes.
  const role = req.auth?.user?.role;
  if (role === "viewer" && !READ_ONLY_SAFE_METHODS.has(req.method) && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Read-only account" }, { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
