import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export default auth((req) => {
  const { pathname } = req.nextUrl

  const isProtected = pathname.startsWith("/app")
  const isAuthed = Boolean(req.auth)

  if (isProtected && !isAuthed) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|s/).*)"],
}
