import { notFound } from "next/navigation"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ShowDetailPage({ params }: Props) {
  const { id } = await params
  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      acts: {
        include: { class: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!show) notFound()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {show.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {new Date(show.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {show.acts.length === 0 ? "Aucun tableau." : `${show.acts.length} tableau(x)`}
      </Typography>
    </Box>
  )
}
