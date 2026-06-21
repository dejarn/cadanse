import { redirect } from "next/navigation"
import Box from "@mui/material/Box"
import { getSession } from "@/lib/get-session"
import { getActiveSeason } from "@/lib/stats-queries"
import { prisma } from "@/lib/prisma"
import ImportClient from "./ImportClient"

export default async function ImportPage() {
  const session = await getSession()
  if (session?.user.role !== "SUPER_ADMIN") redirect("/")

  const season = await getActiveSeason()
  const classes = season
    ? await prisma.class.findMany({
        where: { seasonId: season.id },
        select: { name: true },
        orderBy: { name: "asc" },
      })
    : []

  return (
    <Box>
      <ImportClient
        hasActiveSeason={!!season}
        seasonLabel={season?.label ?? null}
        classNames={classes.map((c) => c.name)}
      />
    </Box>
  )
}
