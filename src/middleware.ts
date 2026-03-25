import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/supplier") && token?.role !== "SUPPLIER") {
      if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard") && token?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (path.startsWith("/dashboard") && token?.role === "SUPPLIER") {
      return NextResponse.redirect(new URL("/supplier", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/supplier/:path*"],
};
