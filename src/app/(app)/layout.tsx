"use client"

import { useState } from "react"
import Box from "@mui/material/Box"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import AppDrawer from "@/components/AppDrawer"
import TopBar from "@/components/TopBar"
import { usePathname } from "next/navigation"

const PAGE_TITLES: Record<string, string> = {
  "/app/dashboard": "Tableau de bord",
  "/app/students": "Élèves",
  "/app/teachers": "Professeurs",
  "/app/classes": "Cours",
  "/app/shows": "Spectacles",
  "/app/admin/users": "Comptes",
  "/app/admin/seasons": "Saisons",
}

function getTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(prefix)) return title
  }
  return "Cadanse"
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  if (status === "loading") return null

  if (!session) {
    redirect("/login")
  }

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
