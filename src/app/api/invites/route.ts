import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await auth()
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const invite = await prisma.inviteToken.create({
    data: { createdBy: session.user.id, expiresAt },
  })

  return NextResponse.json({ token: invite.token, expiresAt: invite.expiresAt }, { status: 201 })
}
