"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

interface AuthCheckProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthCheck({ children, fallback }: AuthCheckProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      if (!fallback) {
        router.push("/login")
      }
    }
  }, [user, loading, router, fallback])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return fallback || null
  }

  return <>{children}</>
}
