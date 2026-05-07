import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"
import TeachersClient from "./TeachersClient"

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({ orderBy: { lastName: "asc" } })

  return (
    <Box>
      <TeachersClient teachers={teachers} />
    </Box>
  )
}
