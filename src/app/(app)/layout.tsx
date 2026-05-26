import { getSession } from "@/lib/get-session"
import { redirect } from "next/navigation"
import AppShell from "@/components/AppShell"
import SessionProvider from "@/components/SessionProvider"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <SessionProvider session={session}>
      <AppShell session={session}>{children}</AppShell>
    </SessionProvider>
  )
}
