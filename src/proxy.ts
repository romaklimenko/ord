import { NextResponse, type NextRequest } from "next/server";
import { hentAuth0, harAuth0Konfiguration } from "@/lib/auth0";

export async function proxy(request: NextRequest) {
  if (!harAuth0Konfiguration()) {
    return NextResponse.next();
  }

  const auth0 = hentAuth0();
  return auth0.middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
