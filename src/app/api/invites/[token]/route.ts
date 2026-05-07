import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = await prisma.inviteToken.findUnique({ where: { token } })

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 410 })
  }

  return NextResponse.json({ valid: true, expiresAt: invite.expiresAt })
}
