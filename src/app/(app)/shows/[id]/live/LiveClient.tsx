"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import CheckIcon from "@mui/icons-material/Check"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlined"
import SkipNextIcon from "@mui/icons-material/SkipNext"
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined"

interface Act {
  id: string
  name: string
  position: number
  className: string | null
  teacherName: string | null
}

interface Props {
  showId: string
  showName: string
  currentPosition: number | null
  acts: Act[]
  slug: string
}

export default function LiveClient({ showId, showName, currentPosition: initialPosition, acts, slug }: Props) {
  const [currentPos, setCurrentPos] = useState<number | null>(initialPosition)
  const confirmedPos = useRef<number | null>(initialPosition)
  const inFlight = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function setCurrentAct(position: number | null) {
    if (inFlight.current) return
    inFlight.current = true
    setError(null)
    setCurrentPos(position)
    const res = await fetch(`/api/shows/${showId}/current-act`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPosition: position }),
    })
    inFlight.current = false
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Une erreur est survenue.")
      setCurrentPos(confirmedPos.current)
      return
    }
    confirmedPos.current = position
  }

  function handleNext() {
    if (acts.length === 0) return
    if (currentPos === null) {
      setCurrentAct(acts[0].position)
      return
    }
    const next = acts.find((a) => a.position > currentPos)
    if (next) setCurrentAct(next.position)
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/s/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const isLast = acts.length > 0 && currentPos !== null && !acts.find((a) => a.position > currentPos)
  const hasNext = acts.length > 0 && !isLast

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {showName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pilotage en direct
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            component={Link}
            href={`/shows/${showId}/order`}
            size="small"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
          >
            Retour
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
            onClick={handleCopyLink}
            sx={copied ? { borderColor: "success.main", color: "success.main" } : {}}
          >
            {copied ? "Copié" : "Lien"}
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        {currentPos === null ? (
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayCircleOutlineIcon />}
            onClick={() => acts.length > 0 && setCurrentAct(acts[0].position)}
            disabled={acts.length === 0}
            sx={{ minWidth: 220 }}
          >
            Démarrer le spectacle
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              size="large"
              startIcon={<StopCircleOutlinedIcon />}
              onClick={() => setCurrentAct(null)}
              sx={{ borderColor: "error.main", color: "error.main", "&:hover": { borderColor: "error.light", color: "error.light" } }}
            >
              Arrêter
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<SkipNextIcon />}
              onClick={handleNext}
              disabled={!hasNext}
              sx={{ minWidth: 200 }}
            >
              Tableau suivant
            </Button>
          </>
        )}
      </Box>

      {acts.length === 0 ? (
        <Typography color="text.secondary">Aucun tableau. Configurez l&apos;ordre de passage d&apos;abord.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {acts.map((act) => {
            const isCurrent = act.position === currentPos
            return (
              <Box
                key={act.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  borderLeft: isCurrent ? "3px solid #D4A853" : "3px solid transparent",
                  bgcolor: isCurrent ? "rgba(212,168,83,0.08)" : "transparent",
                  transition: "all 200ms ease",
                  opacity: currentPos !== null && act.position < currentPos ? 0.35 : 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography
                    sx={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "1.5rem",
                      color: isCurrent ? "primary.main" : "text.secondary",
                      minWidth: 36,
                      lineHeight: 1,
                    }}
                  >
                    {String(act.position + 1).padStart(2, "0")}
                  </Typography>
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

                {!isCurrent && (
                  <Tooltip title="Définir comme tableau en cours">
                    <IconButton
                      size="small"
                      onClick={() => setCurrentAct(act.position)}
                      sx={{ color: "text.disabled", "&:hover": { color: "primary.main" } }}
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )
          })}
        </Box>
      )}
    </>
  )
}
