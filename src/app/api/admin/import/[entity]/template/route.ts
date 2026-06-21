import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { buildTemplate, isEntityKey } from "@/lib/csv-import"

type Params = { params: Promise<{ entity: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { entity } = await params
  if (!isEntityKey(entity)) {
    return NextResponse.json({ error: "Entité inconnue." }, { status: 404 })
  }

  return new NextResponse(buildTemplate(entity), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entity}.csv"`,
    },
  })
}
