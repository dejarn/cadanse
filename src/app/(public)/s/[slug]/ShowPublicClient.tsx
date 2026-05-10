"use client"

import { useEffect, useRef, useState } from "react"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord"

interface Act {
  id: string
  name: string
  position: number
  className: string | null
  teacherName: string | null
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
  const [flash, setFlash] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    const es = new EventSource(`/api/public/shows/${slug}/stream`)

    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)

    es.onmessage = (event: MessageEvent) => {
      const payload: SSEPayload = JSON.parse(event.data)
      setActs(payload.acts)
      setCurrentPosition(payload.currentPosition)

      if (initialized.current) {
        setFlash(true)
        setTimeout(() => setFlash(false), 350)
      } else {
        initialized.current = true
      }
    }

    return () => {
      es.close()
      setConnected(false)
    }
  }, [slug])

  return (
    <Box>
      {currentPosition !== null && (
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
      )}

      {acts.length === 0 ? (
        <Typography color="text.secondary">Pas encore disponible.</Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            opacity: flash ? 0.7 : 1,
            transition: "opacity 350ms ease",
          }}
        >
          {acts.map((act) => {
            const isCurrent = currentPosition !== null && act.position === currentPosition
            const isPast = currentPosition !== null && act.position < currentPosition
            return (
              <Box
                key={act.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  opacity: isPast ? 0.3 : 1,
                  borderLeft: isCurrent ? "3px solid #D4A853" : "3px solid transparent",
                  pl: isCurrent ? 1.5 : 0,
                  transition: "all 300ms ease",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "2rem",
                    color: isCurrent ? "primary.main" : "text.secondary",
                    minWidth: 48,
                    lineHeight: 1,
                    transition: "color 300ms ease",
                  }}
                >
                  {String(act.position + 1).padStart(2, "0")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="body1">{act.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {act.className ? `${act.className} · ${act.teacherName}` : "Sans cours"}
                    </Typography>
                  </Box>
                  {isCurrent && (
                    <Chip
                      label="En cours"
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: "primary.main", color: "primary.main" }}
                    />
                  )}
                </Box>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
