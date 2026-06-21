import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { commitImport, isEntityKey, previewImport } from "@/lib/csv-import"

type Params = { params: Promise<{ entity: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { entity } = await params
  if (!isEntityKey(entity)) {
    return NextResponse.json({ error: "Entité inconnue." }, { status: 404 })
  }

  const form = await req.formData()
  const file = form.get("file")
  const dryRun = form.get("dryRun") !== "false"

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 })
  }

  const text = await file.text()

  const result = dryRun ? await previewImport(entity, text) : await commitImport(entity, text)
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result })
}
