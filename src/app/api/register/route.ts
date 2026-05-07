import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { token, username, password } = await req.json()

  const invite = await prisma.inviteToken.findUnique({ where: { token } })

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 410 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: "Identifiant déjà utilisé." }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.user.create({ data: { username, hashedPassword, role: "ADMIN" } }),
    prisma.inviteToken.update({ where: { token }, data: { usedAt: new Date() } }),
  ])

  return NextResponse.json({ ok: true }, { status: 201 })
}
