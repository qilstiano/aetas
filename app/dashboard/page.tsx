import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CalendarDashboard } from "@/components/calendar-dashboard"

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  // If user settings don't exist, create them
  if (!userSettings) {
    await supabase.from("user_settings").insert({
      user_id: session.user.id,
      email_notifications: true,
      push_notifications: true,
      theme: "system",
    })
  }

  return <CalendarDashboard user={session.user} />
}
