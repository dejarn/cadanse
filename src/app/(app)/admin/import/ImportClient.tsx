"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Box from "@mui/material/Box"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Alert from "@mui/material/Alert"
import Chip from "@mui/material/Chip"
import CircularProgress from "@mui/material/CircularProgress"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Table from "@mui/material/Table"
import TableHead from "@mui/material/TableHead"
import TableBody from "@mui/material/TableBody"
import TableRow from "@mui/material/TableRow"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import DownloadIcon from "@mui/icons-material/Download"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined"
import type { EntityKey, PreviewResult, CommitResult, RowStatus } from "@/lib/csv-import"

type Props = {
  hasActiveSeason: boolean
  seasonLabel: string | null
  classNames: string[]
}

type Tab = {
  key: EntityKey
  label: string
  headers: string[]
  previewColumns?: string[]
  needsSeason: boolean
}

const ENTITY_TABS: Tab[] = [
  { key: "teachers", label: "Professeurs", headers: ["prenom", "nom", "nom_affichage"], needsSeason: false },
  { key: "classes", label: "Cours", headers: ["nom", "horaire", "prof_prenom", "prof_nom"], needsSeason: true },
  { key: "students", label: "Élèves", headers: ["prenom", "nom", "cours"], needsSeason: true },
  {
    key: "shows",
    label: "Spectacle",
    headers: [
      "show_nom",
      "show_date",
      "acte_nom",
      "acte_cours",
      "acte_duree",
      "acte_position",
      "acte_description",
    ],
    previewColumns: ["acte_nom", "acte_cours", "acte_duree", "acte_position", "acte_description"],
    needsSeason: true,
  },
]

const STATUS_META: Record<RowStatus, { color: string; icon: React.ReactNode; label: string }> = {
  ok: { color: "success.main", icon: <CheckCircleIcon fontSize="small" />, label: "Prêt" },
  warning: { color: "warning.main", icon: <WarningAmberIcon fontSize="small" />, label: "Avertissement" },
  error: { color: "error.main", icon: <ErrorOutlineIcon fontSize="small" />, label: "Bloqué" },
}

export default function ImportClient({ hasActiveSeason, seasonLabel, classNames }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [entity, setEntity] = useState<EntityKey>("teachers")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<CommitResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [committing, setCommitting] = useState(false)

  const meta = ENTITY_TABS.find((e) => e.key === entity)!
  const previewCols = meta.previewColumns ?? meta.headers
  const blocked = meta.needsSeason && !hasActiveSeason

  function reset() {
    setFile(null)
    setPreview(null)
    setError(null)
    setDone(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function changeEntity(_: unknown, value: EntityKey | null) {
    if (!value) return
    setEntity(value)
    reset()
  }

  function downloadTemplate() {
    window.location.href = `/api/admin/import/${entity}/template`
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview(null)
    setDone(null)
    setError(null)
    if (!f) return

    setLoading(true)
    const form = new FormData()
    form.append("file", f)
    form.append("dryRun", "true")
    const res = await fetch(`/api/admin/import/${entity}`, { method: "POST", body: form })
    setLoading(false)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error ?? "Erreur lors de l'analyse du fichier.")
      return
    }
    setPreview(data.data as PreviewResult)
  }

  async function confirmImport() {
    if (!file) return
    setCommitting(true)
    setError(null)
    const form = new FormData()
    form.append("file", file)
    form.append("dryRun", "false")
    const res = await fetch(`/api/admin/import/${entity}`, { method: "POST", body: form })
    setCommitting(false)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error ?? "Erreur lors de l'import.")
      return
    }
    setDone(data.data as CommitResult)
    setPreview(null)
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    router.refresh()
  }

  const writableCount = preview ? preview.summary.ok + preview.summary.warning : 0

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ mb: 0.5, fontFamily: "'Cormorant Garamond', serif" }}
        >
          Import CSV
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Téléchargez le modèle, remplissez-le, importez. Aperçu de contrôle avant toute écriture.
        </Typography>
      </Box>

      <ToggleButtonGroup
        value={entity}
        exclusive
        onChange={changeEntity}
        size="small"
        sx={{ mb: 3 }}
      >
        {ENTITY_TABS.map((e) => (
          <ToggleButton
            key={e.key}
            value={e.key}
            sx={{
              px: 2,
              "&.Mui-selected": {
                backgroundColor: "rgba(212,168,83,0.12)",
                color: "primary.main",
                "&:hover": { backgroundColor: "rgba(212,168,83,0.18)" },
              },
            }}
          >
            {e.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Colonnes attendues
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {meta.headers.map((h) => (
            <Chip key={h} label={h} size="small" variant="outlined" />
          ))}
        </Box>

        {entity === "students" ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Colonne <strong>cours</strong> : plusieurs cours séparés par <strong>|</strong>{" "}
            (ex&nbsp;: <code>Ballet A | Jazz B</code>). Un cours introuvable est ignoré (l&apos;élève
            est tout de même créé).
          </Typography>
        ) : null}

        {entity === "classes" ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Le professeur est identifié par son prénom et son nom — il doit déjà exister.
          </Typography>
        ) : null}

        {entity === "shows" ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            <strong>1 fichier = 1 spectacle, 1 ligne = 1 acte.</strong> <code>show_nom</code> et{" "}
            <code>show_date</code> (<code>aaaa-mm-jj</code> ou <code>jj/mm/aaaa</code>) répétés et
            identiques sur chaque ligne. Durée en <code>mm:ss</code> (ex&nbsp;<code>4:30</code>).{" "}
            <code>acte_position</code> verrouille l&apos;ordre. <code>acte_cours</code> introuvable
            est ignoré. Les participants sont créés automatiquement. Si le spectacle existe déjà,
            ses actes sont complétés.
          </Typography>
        ) : null}

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={downloadTemplate}>
            Télécharger le modèle
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<UploadFileIcon />}
            disabled={blocked || loading}
            onClick={() => fileInputRef.current?.click()}
          >
            Choisir un fichier CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={onFileSelected}
          />
          {loading ? <CircularProgress size={20} sx={{ alignSelf: "center" }} /> : null}
          {file && !loading ? (
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
              {file.name}
            </Typography>
          ) : null}
        </Box>
      </Paper>

      {blocked ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Aucune saison active. L&apos;import des {meta.label.toLowerCase()} nécessite une saison active.
        </Alert>
      ) : null}

      {entity !== "teachers" && hasActiveSeason && seasonLabel ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Saison active : <strong>{seasonLabel}</strong>
        </Typography>
      ) : null}

      {entity === "students" && classNames.length > 0 ? (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Noms de cours valides (à copier exactement)
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {classNames.map((n) => (
              <Chip key={n} label={n} size="small" />
            ))}
          </Box>
        </Paper>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {done ? (
        <Alert severity="success" sx={{ mb: 3 }} onClose={reset}>
          {done.mode === "append" ? "Actes ajoutés : " : "Import terminé : "}
          {done.created} créé{done.created > 1 ? "s" : ""}
          {done.skipped > 0 ? `, ${done.skipped} ignoré${done.skipped > 1 ? "s" : ""}` : ""}.
        </Alert>
      ) : null}

      {preview ? (
        <Box>
          {preview.notice ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              {preview.notice}
            </Alert>
          ) : null}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
            <Typography variant="subtitle1">Aperçu</Typography>
            <Chip size="small" color="success" label={`${preview.summary.ok} prêt(s)`} />
            {preview.summary.warning > 0 ? (
              <Chip size="small" color="warning" label={`${preview.summary.warning} avertissement(s)`} />
            ) : null}
            {preview.summary.error > 0 ? (
              <Chip size="small" color="error" label={`${preview.summary.error} bloqué(s)`} />
            ) : null}
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }}>Ligne</TableCell>
                  <TableCell sx={{ width: 48 }}>État</TableCell>
                  {previewCols.map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                  <TableCell>Messages</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preview.rows.map((row) => (
                  <TableRow key={row.line}>
                    <TableCell>{row.line}</TableCell>
                    <TableCell>
                      <Box
                        sx={{ color: STATUS_META[row.status].color, display: "flex", alignItems: "center" }}
                        title={STATUS_META[row.status].label}
                      >
                        {STATUS_META[row.status].icon}
                      </Box>
                    </TableCell>
                    {previewCols.map((h) => (
                      <TableCell key={h}>{row.values[h] ?? ""}</TableCell>
                    ))}
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {row.messages.join(" ")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Button
              variant="contained"
              disabled={committing || writableCount === 0}
              onClick={confirmImport}
            >
              {committing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                `Confirmer l'import (${writableCount})`
              )}
            </Button>
            <Button variant="text" onClick={reset} disabled={committing}>
              Annuler
            </Button>
            {preview.summary.error > 0 ? (
              <Typography variant="caption" color="text.secondary">
                Les lignes bloquées ne seront pas importées.
              </Typography>
            ) : null}
          </Box>
        </Box>
      ) : null}
    </>
  )
}
