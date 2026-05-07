"use client"

import Drawer from "@mui/material/Drawer"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Divider from "@mui/material/Divider"
import DashboardIcon from "@mui/icons-material/Dashboard"
import PeopleIcon from "@mui/icons-material/People"
import PersonIcon from "@mui/icons-material/Person"
import ClassIcon from "@mui/icons-material/Class"
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy"
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"
import { usePathname, useRouter } from "next/navigation"

const DRAWER_WIDTH = 260

const navItems = [
  { label: "Tableau de bord", href: "/app/dashboard", icon: <DashboardIcon /> },
  { label: "Élèves", href: "/app/students", icon: <PeopleIcon /> },
  { label: "Professeurs", href: "/app/teachers", icon: <PersonIcon /> },
  { label: "Cours", href: "/app/classes", icon: <ClassIcon /> },
  { label: "Spectacles", href: "/app/shows", icon: <TheaterComedyIcon /> },
]

const adminItems = [
  { label: "Comptes", href: "/app/admin/users", icon: <AdminPanelSettingsIcon /> },
  { label: "Saisons", href: "/app/admin/seasons", icon: <CalendarMonthIcon /> },
]

interface Props {
  open: boolean
  onClose: () => void
  isSuperAdmin: boolean
}

export default function AppDrawer({ open, onClose, isSuperAdmin }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  function navigate(href: string) {
    router.push(href)
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          transition: "transform 250ms ease",
          boxShadow: "14px 0 30px rgba(0, 0, 0, 0.35)",
        },
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography
          variant="h4"
          sx={{ fontFamily: "'Cormorant Garamond', serif", color: "primary.main", lineHeight: 1 }}
        >
          Cadanse
        </Typography>
      </Box>

      <Divider />

      <List sx={{ flex: 1, pt: 1 }}>
        {navItems.map((item, index) => (
          <ListItem key={item.href} disablePadding>
            <ListItemButton
              selected={pathname.startsWith(item.href)}
              onClick={() => navigate(item.href)}
              sx={{
                mx: 1,
                borderRadius: 1,
                animation: "itemReveal 200ms ease-out",
                animationDelay: `${index * 40}ms`,
                animationFillMode: "both",
                "@keyframes itemReveal": {
                  from: { opacity: 0, transform: "translateY(8px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
                "@media (prefers-reduced-motion: reduce)": {
                  animation: "none",
                },
                "&.Mui-selected": {
                  backgroundColor: "rgba(212,168,83,0.12)",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": { color: "primary.main" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {isSuperAdmin ? (
        <>
          <Divider />
          <List sx={{ pt: 1 }}>
            {adminItems.map((item, index) => (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  selected={pathname.startsWith(item.href)}
                  onClick={() => navigate(item.href)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    animation: "itemReveal 200ms ease-out",
                    animationDelay: `${index * 40}ms`,
                    animationFillMode: "both",
                    "@keyframes itemReveal": {
                      from: { opacity: 0, transform: "translateY(8px)" },
                      to: { opacity: 1, transform: "translateY(0)" },
                    },
                    "@media (prefers-reduced-motion: reduce)": {
                      animation: "none",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "rgba(212,168,83,0.12)",
                      color: "primary.main",
                      "& .MuiListItemIcon-root": { color: "primary.main" },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      ) : null}
    </Drawer>
  )
}
