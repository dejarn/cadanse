"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Alert from "@mui/material/Alert"
import Snackbar from "@mui/material/Snackbar"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import LinkIcon from "@mui/icons-material/Link"
import SaveIcon from "@mui/icons-material/Save"
import AddIcon from "@mui/icons-material/Add"
import SceneTabs from "./SceneTabs"
import StudentSidebar from "./StudentSidebar"
import StageArea from "./StageArea"
import { DOT_COLORS } from "@/lib/colors"
import { dotColor } from "@/lib/colors"

type Student = { id: string; firstName: string; lastName: string }
type Participant = { student: Student; color: number }
type Placement = { studentId: string; x: number; y: number }
type Scene = { id: string; name: string; order: number; placements: Placement[] }

interface Props {
  act: { id: string; name: string }
  show: { id: string; name: string }
  slug: string
  participants: Participant[]
  initialScenes: Scene[]
}

export default function PlacementEditorClient({
  act,
  show,
  slug,
  participants,
  initialScenes,
}: Props) {
  const router = useRouter()

  const [scenes, setScenes] = useState<Scene[]>(initialScenes)
  const [activeSceneId, setActiveSceneId] = useState<string | null>(
    initialScenes[0]?.id ?? null,
  )
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [localColors, setLocalColors] = useState<Map<string, number>>(
    () => new Map(participants.map((p) => [p.student.id, p.color])),
  )
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  // Local placements state (mutated on drag/click, synced to scenes on save)
  const [localPlacements, setLocalPlacements] = useState<Map<string, Placement>>(() => {
    const map = new Map<string, Placement>()
    const scene = initialScenes[0]
    if (scene) {
      for (const p of scene.placements) {
        map.set(p.studentId, p)
      }
    }
    return map
  })

  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedStudentId(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const activeScene = useMemo(
    () => scenes.find((s) => s.id === activeSceneId) ?? null,
    [scenes, activeSceneId],
  )

  const participantMap = useMemo(
    () => new Map(participants.map((p) => [p.student.id, { ...p, color: localColors.get(p.student.id) ?? p.color }])),
    [participants, localColors],
  )

  const placedStudentIds = useMemo(
    () => new Set(localPlacements.keys()),
    [localPlacements],
  )

  const handleSceneChange = useCallback(
    (sceneId: string) => {
      setActiveSceneId(sceneId)
      setSelectedStudentId(null)
      const scene = scenes.find((s) => s.id === sceneId)
      const map = new Map<string, Placement>()
      if (scene) {
        for (const p of scene.placements) {
          map.set(p.studentId, p)
        }
      }
      setLocalPlacements(map)
    },
    [scenes],
  )

  const handleAddScene = useCallback(async () => {
    const name = `Scène ${scenes.length + 1}`
    const res = await fetch(`/api/shows/${show.id}/acts/${act.id}/scenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      setError("Erreur lors de la création de la scène.")
      return
    }
    const { data } = await res.json()
    setScenes((prev) => [...prev, data])
    setActiveSceneId(data.id)
    setLocalPlacements(new Map())
    setSelectedStudentId(null)
    setDirty(false)
  }, [show.id, act.id, scenes.length])

  const handleDeleteScene = useCallback(
    async (sceneId: string) => {
      const res = await fetch(`/api/shows/${show.id}/acts/${act.id}/scenes/${sceneId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        setError("Erreur lors de la suppression.")
        return
      }
      const remaining = scenes.filter((s) => s.id !== sceneId)
      setScenes(remaining)
      if (activeSceneId === sceneId) {
        const next = remaining[0]
        if (next) {
          setActiveSceneId(next.id)
          const map = new Map<string, Placement>()
          for (const p of next.placements) {
            map.set(p.studentId, p)
          }
          setLocalPlacements(map)
        } else {
          setActiveSceneId(null)
          setLocalPlacements(new Map())
        }
        setSelectedStudentId(null)
      }
      setDirty(false)
    },
    [show.id, act.id, scenes, activeSceneId],
  )

  const handleRenameScene = useCallback(
    async (sceneId: string, name: string) => {
      const res = await fetch(`/api/shows/${show.id}/acts/${act.id}/scenes/${sceneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        setError("Erreur lors du renommage.")
        return
      }
      setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, name } : s)))
    },
    [show.id, act.id],
  )

  const handleStageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedStudentId || !stageRef.current) return
      const rect = stageRef.current.getBoundingClientRect()
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
      const clamped = { studentId: selectedStudentId, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }

      setLocalPlacements((prev) => {
        const next = new Map(prev)
        next.set(selectedStudentId, clamped)
        return next
      })
      setSelectedStudentId(null)
      setDirty(true)
    },
    [selectedStudentId],
  )

  const handleDotDrag = useCallback(
    (studentId: string, deltaX: number, deltaY: number) => {
      if (!stageRef.current) return
      const rect = stageRef.current.getBoundingClientRect()
      const pxToPercentX = (deltaX / rect.width) * 100
      const pxToPercentY = (deltaY / rect.height) * 100

      setLocalPlacements((prev) => {
        const existing = prev.get(studentId)
        if (!existing) return prev
        const next = new Map(prev)
        next.set(studentId, {
          ...existing,
          x: Math.max(0, Math.min(100, Math.round(existing.x + pxToPercentX))),
          y: Math.max(0, Math.min(100, Math.round(existing.y + pxToPercentY))),
        })
        return next
      })
      setDirty(true)
    },
    [],
  )

  const handleDotRemove = useCallback((studentId: string) => {
    setLocalPlacements((prev) => {
      const next = new Map(prev)
      next.delete(studentId)
      return next
    })
    setDirty(true)
  }, [])

  const handleColorChange = useCallback(
    async (studentId: string) => {
      const currentColor = localColors.get(studentId) ?? participants.find((p) => p.student.id === studentId)?.color ?? 0
      const nextColor = (currentColor + 1) % DOT_COLORS.length
      const res = await fetch(`/api/shows/${show.id}/acts/${act.id}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, color: nextColor }),
      })
      if (!res.ok) return
      setLocalColors((prev) => new Map(prev).set(studentId, nextColor))
    },
    [show.id, act.id, localColors, participants],
  )

  const handleSave = useCallback(async () => {
    if (!activeSceneId) return
    setSaving(true)
    setError(null)

    const placements = Array.from(localPlacements.values())
    const res = await fetch(
      `/api/shows/${show.id}/acts/${act.id}/scenes/${activeSceneId}/placements`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placements }),
      },
    )

    setSaving(false)

    if (!res.ok) {
      setError("Erreur lors de la sauvegarde.")
      return
    }

    // Sync local scenes state
    setScenes((prev) =>
      prev.map((s) =>
        s.id === activeSceneId ? { ...s, placements } : s,
      ),
    )
    setDirty(false)
    router.refresh()
  }, [activeSceneId, localPlacements, show.id, act.id, router])

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/s/${slug}/placements/${act.id}`
    navigator.clipboard.writeText(url).then(
      () => setSnackbar("Lien copié."),
      () => setSnackbar("Impossible de copier le lien."),
    )
  }, [slug, act.id])

  return (
    <>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Placements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {act.name} · {show.name}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
          <Button component={Link} href={`/shows/${show.id}/order`} variant="outlined" size="small" startIcon={<ArrowBackIcon />}>
            Retour
          </Button>
        </Box>
      </Box>

      {/* Scene tabs */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <SceneTabs
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSceneChange={handleSceneChange}
          onAddScene={handleAddScene}
          onDeleteScene={handleDeleteScene}
          onRenameScene={handleRenameScene}
        />
      </Box>

      {/* Selection info bar */}
      {selectedStudentId && activeScene && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: "rgba(212,168,83,0.08)", border: "1px solid rgba(212,168,83,0.2)" }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: dotColor(localColors.get(selectedStudentId) ?? 0) }} />
          <Typography variant="body2">
            {participantMap.get(selectedStudentId)?.student.firstName} sélectionné — cliquez sur la scène pour placer
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
            Échap pour annuler
          </Typography>
        </Box>
      )}

      {/* Main area */}
      {activeScene ? (
        <Box sx={{ display: "flex", gap: 2, height: "calc(100vh - 300px)", minHeight: 400 }}>
          {/* Sidebar */}
          <StudentSidebar
            participants={Array.from(participantMap.values())}
            placedStudentIds={placedStudentIds}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            onColorChange={handleColorChange}
          />

          {/* Stage */}
          <StageArea
            ref={stageRef}
            placements={Array.from(localPlacements.values())}
            participants={Array.from(participantMap.values())}
            selectedStudentId={selectedStudentId}
            onClick={handleStageClick}
            onDotDrag={handleDotDrag}
            onDotRemove={handleDotRemove}
          />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 8 }}>
          <Typography color="text.secondary">Aucune scène créée.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddScene}>
            Créer une scène
          </Button>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, gap: 1 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? undefined : <SaveIcon />}
            onClick={handleSave}
            disabled={!dirty || saving || !activeSceneId}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {dirty && (
            <Typography variant="caption" color="text.secondary">
              Modifications non enregistrées
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<LinkIcon />}
          onClick={handleCopyLink}
          disabled={!activeSceneId}
        >
          Copier le lien
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  )
}
