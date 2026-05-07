import { prisma } from "@/lib/prisma"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import Box from "@mui/material/Box"
import RegisterForm from "./RegisterForm"

const cardSx = {
  width: "100%",
  maxWidth: 420,
  border: "1px solid",
  borderColor: "primary.light",
  background:
    "linear-gradient(160deg, rgba(26,25,23,0.98) 0%, rgba(20,19,18,0.96) 55%, rgba(15,14,13,0.98) 100%)",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(circle at 15% 10%, rgba(212,168,83,0.16) 0%, transparent 42%), radial-gradient(circle at 85% 95%, rgba(212,168,83,0.07) 0%, transparent 38%)",
  },
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invite = await prisma.inviteToken.findUnique({ where: { token } })

  const invalid = !invite || invite.usedAt !== null || invite.expiresAt < new Date()

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 4, position: "relative", zIndex: 1 }}>
        <Typography
          component="p"
          sx={{
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "text.secondary",
            mb: 1.5,
          }}
        >
          Espace administration
        </Typography>
        <Typography
          variant="h3"
          sx={{
            mb: 0.5,
            fontFamily: "'Cormorant Garamond', serif",
            color: "primary.main",
            lineHeight: 1,
          }}
        >
          {invalid ? "Invitation invalide" : "Créer un compte"}
        </Typography>

        <Divider sx={{ borderColor: "primary.light", opacity: 0.6, mb: 3 }} />

        {invalid ? (
          <Box>
            <Typography variant="body2" color="text.secondary">
              {!invite
                ? "Ce lien d'invitation n'existe pas."
                : invite.usedAt
                  ? "Ce lien d'invitation a déjà été utilisé."
                  : "Ce lien d'invitation a expiré."}
            </Typography>
          </Box>
        ) : (
          <RegisterForm token={token} />
        )}
      </CardContent>
    </Card>
  )
}
