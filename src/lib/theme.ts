"use client"

import { createTheme } from "@mui/material/styles"

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0F0E0D",
      paper: "#1A1917",
    },
    primary: {
      main: "#D4A853",
      contrastText: "#0F0E0D",
    },
    secondary: {
      main: "#9A9089",
    },
    error: {
      main: "#E05252",
    },
    success: {
      main: "#6AAB8E",
    },
    text: {
      primary: "#F5F0E8",
      secondary: "#9A9089",
    },
    divider: "rgba(212,168,83,0.15)",
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h1: { fontFamily: "'Cormorant Garamond', serif" },
    h2: { fontFamily: "'Cormorant Garamond', serif" },
    h3: { fontFamily: "'Cormorant Garamond', serif" },
    h4: { fontFamily: "'Cormorant Garamond', serif" },
    h5: { fontFamily: "'Cormorant Garamond', serif" },
    h6: { fontFamily: "'Cormorant Garamond', serif" },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          "--background": "#0F0E0D",
          "--surface": "#1A1917",
          "--surface-raised": "#221F1C",
          "--accent": "#D4A853",
          "--accent-muted": "rgba(212,168,83,0.15)",
          "--text-primary": "#F5F0E8",
          "--text-secondary": "#9A9089",
          "--error": "#E05252",
          "--success": "#6AAB8E",
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
            scrollBehavior: "auto !important",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(212,168,83,0.15)",
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontFamily: "'DM Sans', sans-serif",
          borderRadius: 8,
          fontWeight: 500,
        },
        containedPrimary: {
          backgroundColor: "#D4A853",
          color: "#0F0E0D",
          "&:hover": {
            backgroundColor: "#c69c4a",
          },
        },
        outlinedPrimary: {
          borderColor: "rgba(212,168,83,0.55)",
          color: "#D4A853",
          "&:hover": {
            borderColor: "#D4A853",
            backgroundColor: "rgba(212,168,83,0.08)",
          },
        },
        containedError: {
          color: "#F5F0E8",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1A1917",
          borderRight: "1px solid rgba(212,168,83,0.15)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1A1917",
          backgroundImage: "none",
          borderBottom: "1px solid rgba(212,168,83,0.15)",
          boxShadow: "none",
        },
      },
    },
  },
})

export default theme
