import {NextResponse} from "next/server";
import {siteSettings} from "./lib/site.mjs";
export function middleware(request) {
  if (request.nextUrl.pathname === "/" && (request.nextUrl.searchParams.has("reset_uid") || request.nextUrl.searchParams.has("reset_token"))) {
    const url = request.nextUrl.clone(); url.pathname = "/app";
    const response = NextResponse.redirect(url);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  const response = NextResponse.next();
  const privatePage = request.nextUrl.pathname === "/app" || request.nextUrl.pathname.startsWith("/app/") || request.nextUrl.pathname.startsWith("/api/");
  if (privatePage || !siteSettings().indexable) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Referrer-Policy", privatePage ? "no-referrer" : "strict-origin-when-cross-origin");
  if (privatePage) response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {matcher: ["/((?!_next/static|_next/image|icon.svg|opengraph-image).*)"]};
