import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { getActiveSeason } from "@/lib/stats-queries"
import { prisma } from "@/lib/prisma"

export default async function ShowsPage() {
  const season = await getActiveSeason()
  const shows = season
    ? await prisma.show.findMany({
        where: { seasonId: season.id },
        orderBy: { date: "asc" },
      })
    : []

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Spectacles
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {!season
          ? "Aucune saison active."
          : shows.length === 0
            ? "Aucun spectacle pour cette saison."
            : `${shows.length} spectacle(s)`}
      </Typography>
    </Box>
  )
}
