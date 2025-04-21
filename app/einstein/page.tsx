"use client"

import { useAuth } from "@/components/auth-provider"
import { MainLayout } from "@/components/main-layout"
import { EinsteinChat } from "@/components/einstein-chat"

export default function EinsteinPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return null // MainLayout already handles loading state
  }

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col overflow-hidden p-6">
        <h1 className="mb-4 text-2xl font-bold text-white">einstein</h1>
        <p className="mb-6 text-gray-400">Ask questions and get answers in markdown format.</p>
        {user && <EinsteinChat userId={user.id} />}
      </div>
    </MainLayout>
  )
}
