"use client"

import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import type { Act, ActPosition, Class, Show } from "@prisma/client"

type ShowWithActs = Show & {
  acts: (Act & { class: Class })[]
  actPositions: ActPosition[]
}

interface Props {
  show: ShowWithActs
}

export default function OrderClient({ show }: Props) {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ordre de passage — {show.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {show.acts.length === 0
          ? "Aucun tableau pour ce spectacle."
          : "Configuration de l'ordre de passage. (À implémenter)"}
      </Typography>
    </Box>
  )
}
