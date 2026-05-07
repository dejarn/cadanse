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
        body: {
          background:
            "radial-gradient(circle at 12% 0%, rgba(212,168,83,0.06) 0%, transparent 36%), radial-gradient(circle at 90% 100%, rgba(212,168,83,0.04) 0%, transparent 40%), #0F0E0D",
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
          letterSpacing: "0.01em",
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
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: "#9A9089",
          "&.Mui-focused": {
            color: "#D4A853",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#221F1C",
          borderRadius: 8,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(212,168,83,0.24)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(212,168,83,0.42)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#D4A853",
            borderWidth: 1,
          },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "#E05252",
          },
        },
        input: {
          color: "#F5F0E8",
          "&::placeholder": {
            color: "#9A9089",
            opacity: 1,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "1px solid transparent",
        },
        standardError: {
          color: "#F5F0E8",
          backgroundColor: "rgba(224,82,82,0.12)",
          borderColor: "rgba(224,82,82,0.35)",
        },
        standardSuccess: {
          color: "#F5F0E8",
          backgroundColor: "rgba(106,171,142,0.12)",
          borderColor: "rgba(106,171,142,0.35)",
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
