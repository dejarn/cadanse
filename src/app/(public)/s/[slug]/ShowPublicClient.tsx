"use client"

import { useEffect, useState } from "react"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord"

interface Act {
  id: string
  name: string
  position: number
}

interface SSEPayload {
  acts: Act[]
  currentPosition: number | null
}

interface Props {
  initialActs: Act[]
  currentPosition: number | null
  slug: string
}

export default function ShowPublicClient({ initialActs, currentPosition: initialPosition, slug }: Props) {
  const [acts, setActs] = useState<Act[]>(initialActs)
  const [currentPosition, setCurrentPosition] = useState<number | null>(initialPosition)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const es = new EventSource(`/api/public/shows/${slug}/stream`)

    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)

    es.onmessage = (event: MessageEvent) => {
      const payload: SSEPayload = JSON.parse(event.data)
      setActs(payload.acts)
      setCurrentPosition(payload.currentPosition)
    }

    return () => {
      es.close()
      setConnected(false)
    }
  }, [slug])

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        {connected ? (
          <Chip
            icon={<FiberManualRecordIcon sx={{ fontSize: 10, color: "success.main" }} />}
            label="En direct"
            size="small"
            variant="outlined"
            sx={{ borderColor: "success.main", color: "success.main" }}
          />
        ) : (
          <Chip
            label="Connexion perdue — actualisation automatique…"
            size="small"
            variant="outlined"
            color="error"
          />
        )}
      </Box>

      {acts.length === 0 ? (
        <Typography color="text.secondary">Ordre de passage non disponible.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {acts.map((act) => (
            <Box
              key={act.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                opacity: currentPosition !== null && act.position < currentPosition ? 0.4 : 1,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "2rem",
                  color: "primary.main",
                  minWidth: 48,
                  lineHeight: 1,
                }}
              >
                {String(act.position + 1).padStart(2, "0")}
              </Typography>
              <Typography variant="body1">{act.name}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
