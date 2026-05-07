import Box from "@mui/material/Box"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Typography from "@mui/material/Typography"

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 560,
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(150deg, rgba(26,25,23,0.98) 0%, rgba(20,19,18,0.97) 60%, rgba(15,14,13,0.99) 100%)",
          borderColor: "rgba(212,168,83,0.28)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 10% 8%, rgba(212,168,83,0.18) 0%, transparent 38%), radial-gradient(circle at 92% 90%, rgba(212,168,83,0.09) 0%, transparent 42%)",
          },
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 }, position: "relative", zIndex: 1 }}>
          <Typography
            variant="h1"
            sx={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "primary.main",
              lineHeight: 0.85,
              fontSize: { xs: "4.5rem", md: "6rem" },
              mb: 1,
            }}
          >
            404
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Cormorant Garamond', serif",
              mb: 1.5,
            }}
          >
            Cette page n&apos;existe pas
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 440, mb: 3 }}>
            Le spectacle continue, mais pas ici.
          </Typography>

        </CardContent>
      </Card>
    </Box>
  )
}
