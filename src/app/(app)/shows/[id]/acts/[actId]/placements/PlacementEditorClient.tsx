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
import CheckIcon from "@mui/icons-material/Check"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Per-scene placements — Map<sceneId, Map<studentId, Placement>>
  const [scenePlacements, setScenePlacements] = useState<Map<string, Map<string, Placement>>>(() => {
    const map = new Map<string, Map<string, Placement>>()
    for (const scene of initialScenes) {
      map.set(scene.id, new Map(scene.placements.map((p) => [p.studentId, p])))
    }
    return map
  })
  const [dirtyScenes, setDirtyScenes] = useState<Set<string>>(() => new Set())

  // Derived: active scene's placements (memoized — stable ref)
  const localPlacements = useMemo(
    () => (activeSceneId ? scenePlacements.get(activeSceneId) : undefined) ?? new Map<string, Placement>(),
    [activeSceneId, scenePlacements],
  )

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

  // --- Helpers ---

  const markSceneDirty = useCallback((sceneId: string) => {
    setDirtyScenes((prev) => new Set(prev).add(sceneId))
  }, [])

  const updateScenePlacements = useCallback(
    (sceneId: string, updater: (prev: Map<string, Placement>) => Map<string, Placement>) => {
      setScenePlacements((prev) => {
        const next = new Map(prev)
        const current = prev.get(sceneId) ?? new Map<string, Placement>()
        next.set(sceneId, updater(new Map(current)))
        return next
      })
      markSceneDirty(sceneId)
    },
    [markSceneDirty],
  )

  // --- Scene management ---

  const handleSceneChange = useCallback((sceneId: string) => {
    setActiveSceneId(sceneId)
  }, [])

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
    setScenePlacements((prev) => new Map(prev).set(data.id, new Map()))
    setSelectedStudentId(null)
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
      setScenePlacements((prev) => { const n = new Map(prev); n.delete(sceneId); return n })
      setDirtyScenes((prev) => { const n = new Set(prev); n.delete(sceneId); return n })
      if (activeSceneId === sceneId) {
        const next = remaining[0]
        setActiveSceneId(next?.id ?? null)
        setSelectedStudentId(null)
      }
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

  const handleDuplicateScene = useCallback(async (sourceSceneId: string) => {
    const source = scenes.find((s) => s.id === sourceSceneId)
    if (!source) return
    const name = `${source.name} (copie)`
    const res = await fetch(`/api/shows/${show.id}/acts/${act.id}/scenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) { setError("Erreur lors de la duplication."); return }
    const { data } = await res.json()
    const sourcePlacements = scenePlacements.get(sourceSceneId) ?? new Map<string, Placement>()
    const copied = new Map(sourcePlacements)
    setScenes((prev) => [...prev, { ...data, placements: [] }])
    setScenePlacements((prev) => new Map(prev).set(data.id, copied))
    setDirtyScenes((prev) => new Set(prev).add(data.id))
    setActiveSceneId(data.id)
    setSelectedStudentId(null)
  }, [show.id, act.id, scenes, scenePlacements])

  // --- Placement handlers ---

  const handleStageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedStudentId || !stageRef.current || !activeSceneId) return
      const rect = stageRef.current.getBoundingClientRect()
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
      const clamped = { studentId: selectedStudentId, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
      updateScenePlacements(activeSceneId, (prev) => {
        const next = new Map(prev)
        next.set(selectedStudentId, clamped)
        return next
      })
      setSelectedStudentId(null)
    },
    [selectedStudentId, activeSceneId, updateScenePlacements],
  )

  const handleDotDrag = useCallback(
    (studentId: string, deltaX: number, deltaY: number) => {
      if (!stageRef.current || !activeSceneId) return
      const rect = stageRef.current.getBoundingClientRect()
      const pxToPercentX = (deltaX / rect.width) * 100
      const pxToPercentY = (deltaY / rect.height) * 100
      updateScenePlacements(activeSceneId, (prev) => {
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
    },
    [activeSceneId, updateScenePlacements],
  )

  const handleDotRemove = useCallback((studentId: string) => {
    if (!activeSceneId) return
    updateScenePlacements(activeSceneId, (prev) => {
      const next = new Map(prev)
      next.delete(studentId)
      return next
    })
  }, [activeSceneId, updateScenePlacements])

  const handleColorChange = useCallback(
    async (studentId: string, colorIndex?: number) => {
      const nextColor = colorIndex ?? ((localColors.get(studentId) ?? participants.find((p) => p.student.id === studentId)?.color ?? 0) + 1) % DOT_COLORS.length
      const res = await fetch(`/api/shows/${show.id}/acts/${act.id}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, color: nextColor }),
      })
      if (!res.ok) {
        setError("Erreur lors du changement de couleur.")
        return
      }
      setLocalColors((prev) => new Map(prev).set(studentId, nextColor))
    },
    [show.id, act.id, localColors, participants],
  )

  // --- Global save (all dirty scenes in parallel) ---

  const handleSave = useCallback(async () => {
    if (dirtyScenes.size === 0) return
    setSaving(true)
    setError(null)

    const ids = [...dirtyScenes]
    const results = await Promise.all(
      ids.map((sceneId) =>
        fetch(`/api/shows/${show.id}/acts/${act.id}/scenes/${sceneId}/placements`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placements: Array.from(scenePlacements.get(sceneId)?.values() ?? []) }),
        }),
      ),
    )

    const failed = results.some((res) => !res.ok)
    if (failed) {
      setError("Erreur lors de la sauvegarde.")
      setSaving(false)
      return
    }

    // Sync scenes state with saved placements
    setScenes((prev) =>
      prev.map((s) => {
        if (!ids.includes(s.id)) return s
        return { ...s, placements: Array.from(scenePlacements.get(s.id)?.values() ?? []) }
      }),
    )
    setDirtyScenes((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
    setSaving(false)
    router.refresh()
  }, [dirtyScenes, scenePlacements, show.id, act.id, router])

  const handleReorderScenes = useCallback(async (ids: string[]) => {
    const prev = scenes
    const reordered = ids.map((id) => scenes.find((s) => s.id === id)!).filter(Boolean)
    setScenes(reordered)
    const res = await fetch(`/api/shows/${show.id}/acts/${act.id}/scenes/order`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    if (!res.ok) {
      setScenes(prev)
      setError("Erreur lors du réordonnement.")
    }
  }, [scenes, show.id, act.id])

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/s/${slug}/placements/${act.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
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
          <Button
            variant="outlined"
            size="small"
            startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
            onClick={handleCopyLink}
            disabled={!activeSceneId}
            sx={copied ? { borderColor: "success.main", color: "success.main" } : {}}
          >
            {copied ? "Copié" : "Lien"}
          </Button>
        </Box>
      </Box>

      {/* Scene tabs */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <SceneTabs
          scenes={scenes}
          activeSceneId={activeSceneId}
          dirtySceneIds={dirtyScenes}
          onSceneChange={handleSceneChange}
          onAddScene={handleAddScene}
          onDeleteScene={handleDeleteScene}
          onRenameScene={handleRenameScene}
          onDuplicateScene={handleDuplicateScene}
          onReorderScenes={handleReorderScenes}
        />
      </Box>

      {/* Selection info bar — always visible, save button justifies reserved space */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: "rgba(212,168,83,0.08)", border: "1px solid rgba(212,168,83,0.2)" }}>
        {/* Student selection info — hidden when no selection */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, visibility: selectedStudentId && activeScene ? "visible" : "hidden", flex: 1, minWidth: 0 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, bgcolor: dotColor(localColors.get(selectedStudentId ?? "") ?? 0) }} />
          <Typography variant="body2" noWrap>
            {selectedStudentId ? `${participantMap.get(selectedStudentId)?.student.firstName} ${participantMap.get(selectedStudentId)?.student.lastName} sélectionné — cliquez sur la scène pour placer` : " "}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            Échap pour annuler
          </Typography>
        </Box>
        {/* Save button — always occupies space */}
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {dirtyScenes.size > 0 && !saving && (
            <Typography variant="caption" color="text.secondary">
              Non enregistré
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? undefined : <SaveIcon />}
            onClick={handleSave}
            disabled={dirtyScenes.size === 0 || saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </Box>
      </Box>

      {/* Main area */}
      {activeScene ? (
        <Box sx={{ display: "flex", gap: 2, height: "calc(100vh - 300px)", minHeight: 400 }}>
          {/* Sidebar */}
          <StudentSidebar
            participants={Array.from(participantMap.values())}
            placedStudentIds={placedStudentIds}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
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
            onSelectStudent={setSelectedStudentId}
            onColorChange={handleColorChange}
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

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </>
  )
}
