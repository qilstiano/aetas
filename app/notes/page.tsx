"use client"

import { useAuth } from "@/components/auth-provider"
import { MainLayout } from "@/components/main-layout"
import { NotesPage } from "@/components/notes-page"
import { Loader2 } from "lucide-react"

export default function NotesPageContainer() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <p>Please log in to view your notes.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <NotesPage userId={user.id} />
    </MainLayout>
  )
}
