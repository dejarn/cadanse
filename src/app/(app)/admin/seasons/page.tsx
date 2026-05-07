import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"
import SeasonsClient from "./SeasonsClient"

export default async function SeasonsPage() {
  const session = await auth()
  if (session?.user.role !== "SUPER_ADMIN") redirect("/")

  const seasons = await prisma.season.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <Box>
      <SeasonsClient seasons={seasons} />
    </Box>
  )
}
