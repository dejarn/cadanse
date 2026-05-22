import { redirect } from "next/navigation"
import { getSession } from "@/lib/get-session"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"
import SeasonsClient from "./SeasonsClient"

export default async function SeasonsPage() {
  const session = await getSession()
  if (session?.user.role !== "SUPER_ADMIN") redirect("/")

  const seasons = await prisma.season.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <Box>
      <SeasonsClient seasons={seasons} />
    </Box>
  )
}
