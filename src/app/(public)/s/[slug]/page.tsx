import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"
import { resolveShowBySlug } from "@/lib/slug-resolver"
import { toPublicAct, publicActInclude } from "@/lib/publicAct"
import ShowPublicClient from "./ShowPublicClient"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const showId = await resolveShowBySlug(slug)
  if (!showId) return { title: "Cadanse" }

  const show = await prisma.show.findUnique({
    where: { id: showId },
    select: { name: true, date: true, season: { select: { label: true } } },
  })
  if (!show) return { title: "Cadanse" }

  const dateLabel = new Date(show.date).toLocaleDateString("fr-FR", { dateStyle: "long" })
  const title = `${show.name} — ${show.season.label}`
  const description = `${dateLabel} · Saison ${show.season.label}`
  const url = `/s/${slug}`

  return {
    title,
    description,
    openGraph: { title, description, type: "website", url },
    twitter: { card: "summary", title, description },
  }
}

export default async function PublicShowPage({ params }: Props) {
  const { slug } = await params

  const showId = await resolveShowBySlug(slug)
  if (!showId) notFound()

  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: {
      actPositions: {
        include: publicActInclude,
        orderBy: { position: "asc" },
      },
    },
  })

  if (!show) notFound()

  const orderedActs = show.actPositions.map(toPublicAct)

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography
        variant="h3"
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
