import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { DUPLICATE_PRODUCTION_HOST, PRODUCTION_SITE_URL } from "@/lib/seo/site-url";
import { LEGACY_CATEGORY_SLUGS } from "@/lib/seo/legacy-slugs";

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

/** Metadata routes that only reach the proxy for the duplicate-host redirect (see config.matcher). */
const METADATA_FILES = ["/robots.txt", "/sitemap.xml"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The production alias goldensevenfoods.vercel.app serves the whole site as duplicate content:
  // send it to the real domain, same path + query. Exact host match only -- preview deployments
  // (other *.vercel.app hosts) keep working.
  const host = (request.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  if (host === DUPLICATE_PRODUCTION_HOST) {
    return NextResponse.redirect(`${PRODUCTION_SITE_URL}${pathname}${search}`, 308);
  }
  if (METADATA_FILES.includes(pathname)) return NextResponse.next();

  if (pathname.startsWith("/admin")) {
    if (PUBLIC_ADMIN_PATHS.some((path) => pathname === path)) {
      return NextResponse.next();
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Renamed category slugs live in the query string (/ar/products?category=frensh-fries), which
  // next.config redirects can't rewrite cleanly (they pass the old query through) -- 301 here.
  const oldCategory = request.nextUrl.searchParams.get("category");
  if (oldCategory && LEGACY_CATEGORY_SLUGS[oldCategory] && /^\/(ar|en)\/products\/?$/.test(pathname)) {
    const url = request.nextUrl.clone();
    url.searchParams.set("category", LEGACY_CATEGORY_SLUGS[oldCategory]);
    return NextResponse.redirect(url, 301);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/robots.txt", "/sitemap.xml"],
};
