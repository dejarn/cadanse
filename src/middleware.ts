import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const PUBLIC_PAGES = ["/login", "/invite/"]
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/public", "/api/invites/", "/api/register"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthed = Boolean(req.auth)
  const role = req.auth?.user?.role

  // API routes: 401 JSON for unauthenticated, skip page logic
  if (pathname.startsWith("/api/")) {
    const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
    if (!isPublicApi && !isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Page routes
  const isPublicPage = pathname === "/" || PUBLIC_PAGES.some((p) => pathname.startsWith(p))
  if (!isPublicPage && !isAuthed) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthed && pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|s/).*)"],
}
