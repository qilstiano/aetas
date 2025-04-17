import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "@/components/settings-form"

export default async function SettingsPage() {
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

  return <SettingsForm user={session.user} settings={userSettings} />
}
