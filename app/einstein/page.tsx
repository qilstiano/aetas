import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { MainLayout } from "@/components/main-layout"
import { EinsteinChat } from "@/components/einstein-chat"

export default async function EinsteinPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <MainLayout user={session.user}>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">einstein</h1>
          <p className="text-muted-foreground">Ask questions and get AI-powered answers to help with your studies.</p>
        </div>

        <EinsteinChat userId={session.user.id} />
      </div>
    </MainLayout>
  )
}
