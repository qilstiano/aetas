import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { CalendarDashboard } from "@/components/calendar-dashboard"
import { MainLayout } from "@/components/main-layout"

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <MainLayout
      user={{ id: session.user.id, email: session.user.email, full_name: session.user.user_metadata?.full_name }}
    >
      <CalendarDashboard user={session.user} />
    </MainLayout>
  )
}
