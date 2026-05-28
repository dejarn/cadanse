import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Button from "@mui/material/Button"
import ChecklistIcon from "@mui/icons-material/Checklist"
import TuneIcon from "@mui/icons-material/Tune"
import LiveTvIcon from "@mui/icons-material/LiveTv"
import {
  getActiveSeason,
  getUpcomingShow,
} from "@/lib/stats-queries"

function formatCountdown(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const days = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (days === 0) return "Aujourd'hui !"
  if (days === 1) return "Demain"
  return `Dans ${days} jours`
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return h > 0
    ? `${h}h${String(m).padStart(2, "0")}min`
    : `${m}min${s > 0 ? ` ${String(s).padStart(2, "0")}s` : ""}`
}

export default async function DashboardPage() {
  const season = await getActiveSeason()

  if (!season) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Cadanse
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aucune saison active.
        </Typography>
      </Box>
    )
  }

  const show = await getUpcomingShow(season.id)

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Saison {season.label}
      </Typography>

      {show ? (
        <Card sx={{ mb: 4, borderLeft: "4px solid", borderColor: "primary.main", background: "radial-gradient(ellipse at top left, rgba(212,168,83,0.08) 0%, transparent 60%), var(--surface)" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              {show.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {new Date(show.date).toLocaleDateString("fr-FR", { dateStyle: "long" })} · <Box component="span" color="primary.main">{formatCountdown(show.date)}</Box>
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {show.totalActs} tableau{show.totalActs !== 1 ? "x" : ""}
              {show.totalDuration > 0 && ` · ${formatDuration(show.totalDuration)}`}
              {show.missingDuration > 0 && ` · ${show.missingDuration} sans durée`}
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                href={`/shows/${show.id}/order`}
                variant="outlined"
                size="small"
                startIcon={<TuneIcon />}
              >
                Organiser
              </Button>
              <Button
                href={`/shows/${show.id}/live`}
                variant="outlined"
                size="small"
                startIcon={<LiveTvIcon />}
              >
                Live
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Aucun spectacle &agrave; venir.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Button
        href="/rollcall"
        variant="outlined"
        size="large"
        startIcon={<ChecklistIcon />}
      >
        Feuille d&apos;appel
      </Button>
    </Box>
  )
}
