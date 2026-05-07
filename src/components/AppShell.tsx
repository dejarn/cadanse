"use client"

import { useState } from "react"
import Box from "@mui/material/Box"
import { usePathname } from "next/navigation"
import AppDrawer from "@/components/AppDrawer"
import TopBar from "@/components/TopBar"
import type { Session } from "next-auth"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/students": "Élèves",
  "/teachers": "Professeurs",
  "/classes": "Cours",
  "/shows": "Spectacles",
  "/admin/users": "Comptes",
  "/admin/seasons": "Saisons",
}

function getTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(prefix)) return title
  }
  return "Cadanse"
}

interface Props {
  session: Session
  children: React.ReactNode
}

export default function AppShell({ session, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const title = getTitle(pathname)

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopBar
        title={title}
        username={session.user.username}
        onMenuClick={() => setDrawerOpen(true)}
      />
      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isSuperAdmin={isSuperAdmin}
      />
      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1200,
            mx: "auto",
            animation: "pageEnter 200ms ease-out",
            "@keyframes pageEnter": {
              from: { opacity: 0, transform: "translateY(8px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
