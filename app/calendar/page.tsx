import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CalendarPage } from "@/components/calendar-page"

export default async function CalendarRoute() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return <CalendarPage user={session.user} />
}
