"use client"

import { useState } from "react"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import MenuIcon from "@mui/icons-material/Menu"
import AccountCircleIcon from "@mui/icons-material/AccountCircle"
import { signOut } from "next-auth/react"

interface Props {
  title: string
  username: string
  onMenuClick: () => void
}

export default function TopBar({ title, username, onMenuClick }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            flex: 1,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 0.2,
            color: "text.primary",
          }}
        >
          {title}
        </Typography>

        <IconButton
          color="inherit"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="compte utilisateur"
        >
          <AccountCircleIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              {username}
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null)
              signOut({ callbackUrl: "/login" })
            }}
          >
            Se déconnecter
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
