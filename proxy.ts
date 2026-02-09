import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "./lib/auth";

const publicRoutes = ["/login"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  const session = request.cookies.get("session")?.value;
  const payload = await decrypt(session);

  // Redirect to login if not authenticated and trying to access protected route
  if (!isPublicRoute && !payload?.authenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to home if authenticated and trying to access login
  if (isPublicRoute && payload?.authenticated) {
    return NextResponse.redirect(new URL("/suggested", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
