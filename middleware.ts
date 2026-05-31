import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function isAdminRole(role: unknown): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

function isJuryRole(role: unknown): boolean {
  return role === "JURY";
}

function buildLoginRedirect(request: NextRequest, callbackUrl: string): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isJuryPath = pathname === "/jury" || pathname.startsWith("/jury/");
  const isDisplayPath = pathname === "/display" || pathname.startsWith("/display/");

  if (!isAdminPath && !isJuryPath && !isDisplayPath) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  if (!token) {
    if (isAdminPath) {
      return buildLoginRedirect(request, "/admin");
    }

    if (isDisplayPath) {
      return buildLoginRedirect(request, "/display");
    }

    return buildLoginRedirect(request, "/jury");
  }

  const role = token.role;

  if (isAdminPath && !isAdminRole(role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isJuryPath && !isJuryRole(role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isDisplayPath && !isAdminRole(role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/display/:path*", "/jury/:path*"],
};
