"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Calendar, ChevronLeft, ChevronRight, Home, LogOut, NotebookPen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { MetallicGradient } from "@/components/metallic-gradient"
import { LoadingScreen } from "@/components/loading-screen"

interface MainLayoutProps {
  children: React.ReactNode
  user: {
    id: string
    email: string
    full_name?: string
  }
}

export function MainLayout({ children, user }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Simulate loading for a short time to ensure components are ready
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    // Safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      setIsLoading(false)
    }, 3000) // Force hide after 3 seconds

    return () => {
      clearTimeout(timer)
      clearTimeout(safetyTimer)
    }
  }, [])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <LoadingScreen isLoading={isLoading} />
      <MetallicGradient />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 z-50 flex w-64 flex-col border-r bg-background/80 backdrop-blur-md transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0`}
        >
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="font-ibm-plex-mono text-xl font-bold tracking-tight">aetas</span>
            </Link>
          </div>

          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-2">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
                  pathname === "/dashboard" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/calendar"
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
                  pathname === "/calendar" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Calendar
              </Link>
              <Link
                href="/notes"
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
                  pathname === "/notes" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <NotebookPen className="h-4 w-4" />
                Notes
              </Link>
            </nav>
          </div>

          <div className="border-t p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-center leading-8">
                {user.full_name ? user.full_name[0] : user.email[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{user.full_name || user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Toggle sidebar button */}
        <button
          className="fixed bottom-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        {/* Main content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
