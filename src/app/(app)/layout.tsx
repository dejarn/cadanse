import { getSession } from "@/lib/get-session"
import { redirect } from "next/navigation"
import AppShell from "@/components/AppShell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  return <AppShell session={session}>{children}</AppShell>
}
