import { NextResponse } from "next/server";

export function middleware(req) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return new NextResponse("Auth required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Area"',
        },
      });
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = atob(base64Credentials);
    const [user, pass] = credentials.split(":");

    if (
      user !== process.env.ADMIN_PANEL_USER ||
      pass !== process.env.ADMIN_PANEL_PASS
    ) {
      return new NextResponse("Invalid credentials", { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
