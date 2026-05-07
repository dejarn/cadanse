import { notFound } from "next/navigation"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"
import ShowPublicClient from "./ShowPublicClient"

function slugify(name: string, seasonLabel: string): string {
  const raw = `${name}-${seasonLabel}`
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PublicShowPage({ params }: Props) {
  const { slug } = await params

  const shows = await prisma.show.findMany({
    include: {
      season: true,
      actPositions: {
        include: { act: true },
        orderBy: { position: "asc" },
      },
    },
  })

  const show = shows.find((s) => slugify(s.name, s.season.label) === slug)
  if (!show) notFound()

  const orderedActs = show.actPositions.map((ap) => ({
    id: ap.actId,
    name: ap.act.name,
    position: ap.position,
  }))

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography
        variant="h2"
        sx={{ fontFamily: "'Cormorant Garamond', serif", color: "primary.main", mb: 1 }}
      >
        {show.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        {new Date(show.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}
      </Typography>

      <ShowPublicClient
        initialActs={orderedActs}
        currentPosition={show.currentPosition}
        slug={slug}
      />
    </Box>
  )
}
