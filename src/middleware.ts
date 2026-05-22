import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const PUBLIC_PREFIXES = ["/login", "/invite/"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthed = Boolean(req.auth)
  const role = req.auth?.user?.role

  const isPublic = pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))

  if (!isPublic && !isAuthed) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthed && pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // If it's an API route (not auth or public), check session
  if (pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/api/public") &&
      !pathname.startsWith("/api/invites") &&  // invite token check is public
      !isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|s/).*)"],
}
