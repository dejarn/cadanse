import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { getActiveSeason } from "@/lib/stats-queries"
import { prisma } from "@/lib/prisma"
import ShowsClient from "./ShowsClient"

export default async function ShowsPage() {
  const season = await getActiveSeason()

  if (!season) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Spectacles
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aucune saison active.
        </Typography>
      </Box>
    )
  }

  const shows = await prisma.show.findMany({
    where: { seasonId: season.id },
    orderBy: { date: "asc" },
    include: { _count: { select: { acts: true } } },
  })

  return <ShowsClient shows={shows} seasonId={season.id} />
}
