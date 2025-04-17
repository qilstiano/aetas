import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NotesPage } from "@/components/notes-page"

export default async function NotesRoute() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return <NotesPage user={session.user} />
}
