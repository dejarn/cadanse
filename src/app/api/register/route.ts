import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { token, username, password } = await req.json()

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return NextResponse.json({ error: "Identifiant invalide (3 caractères minimum)." }, { status: 400 })
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Mot de passe trop court (8 caractères minimum)." }, { status: 400 })
  }

  const invite = await prisma.inviteToken.findUnique({ where: { token } })

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 410 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    await prisma.$transaction([
      prisma.user.create({ data: { username, hashedPassword, role: "ADMIN" } }),
      prisma.inviteToken.update({ where: { token }, data: { usedAt: new Date() } }),
    ])
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Identifiant déjà utilisé." }, { status: 409 })
    }
    throw e
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
