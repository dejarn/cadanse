"use client"

import React, { useRef, useState } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"

export default function DurationStepper({
  value,
  onChange,
  label,
  max,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  max?: number
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const num = parseInt(value || "0", 10)
  const dec = () => onChange(String(Math.max(0, num - 1)))
  const inc = () => onChange(String(max !== undefined ? Math.min(max, num + 1) : num + 1))

  function startEdit() {
    setDraft(num > 0 ? String(num) : "")
    setEditing(true)
    setTimeout(() => { inputRef.current?.select() }, 0)
  }

  function commitEdit() {
    const parsed = parseInt(draft, 10)
    if (!isNaN(parsed)) {
      const clamped = max !== undefined ? Math.min(max, Math.max(0, parsed)) : Math.max(0, parsed)
      onChange(String(clamped))
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitEdit()
    if (e.key === "Escape") setEditing(false)
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={dec}
          sx={{ border: "1px solid", borderColor: "divider", width: 40, height: 40 }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Box
          onClick={startEdit}
          sx={{
            minWidth: 64,
            textAlign: "center",
            border: "1px solid",
            borderColor: editing ? "primary.main" : "rgba(212,168,83,0.4)",
            borderRadius: 1.5,
            px: 2,
            py: 1,
            cursor: "text",
            position: "relative",
          }}
        >
          {editing ? (
            <Box
              component="input"
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={draft}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              sx={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontVariantNumeric: "tabular-nums",
                fontSize: "1.75rem",
                color: "primary.main",
                fontWeight: 500,
                lineHeight: 1,
                textAlign: "center",
                fontFamily: "inherit",
                p: 0,
                "appearance": "textfield",
                "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": { display: "none" },
              }}
            />
          ) : (
            <Typography
              sx={{
                fontVariantNumeric: "tabular-nums",
                fontSize: "1.75rem",
                color: "primary.main",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {String(num).padStart(2, "0")}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={inc}
          sx={{ border: "1px solid", borderColor: "divider", width: 40, height: 40 }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  )
}
