import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import UsersClient from "./UsersClient"

export default async function UsersPage() {
  const session = await auth()
  if (session?.user.role !== "SUPER_ADMIN") redirect("/")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, role: true, createdAt: true },
  })

  return <UsersClient users={users} currentUserId={session.user.id} />
}
