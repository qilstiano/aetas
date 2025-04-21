"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Calendar, FileText, Home, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { LoadingScreen } from "@/components/loading-screen"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [initials, setInitials] = useState("...")
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      const nameParts = user.user_metadata.full_name.split(" ")
      const firstInitial = nameParts[0] ? nameParts[0][0] : ""
      const lastInitial = nameParts[1] ? nameParts[1][0] : ""
      setInitials((firstInitial + lastInitial).toUpperCase())
    } else if (user?.email) {
      setInitials(user.email[0].toUpperCase())
    }
  }, [user])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      })
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0e0014]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-lg font-medium text-primary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0e0014]">
      {isSigningOut && <LoadingScreen isLoading={true} />}
      {/* Sidebar */}
      <div className="flex w-20 flex-col items-center border-r border-purple-900/20 bg-black/40">
        {/* Logo */}
        <div className="flex h-20 w-full items-center justify-center border-b border-purple-900/20">
          <h1 className="app-title text-2xl font-bold tracking-tight text-white">a</h1>
        </div>

        {/* Navigation */}
        <div className="flex flex-1 flex-col items-center gap-4 py-8">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-lg ${
                pathname === "/dashboard" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="sr-only">Dashboard</span>
            </Button>
          </Link>
          <Link href="/calendar">
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-lg ${
                pathname === "/calendar" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="sr-only">Calendar</span>
            </Button>
          </Link>
          <Link href="/notes">
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-lg ${
                pathname === "/notes" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="sr-only">Notes</span>
            </Button>
          </Link>
          <Link href="/einstein">
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-lg ${
                pathname === "/einstein" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <div className="relative h-5 w-5">
                <Image src="/einstein-icon.png" alt="einstein" fill className="object-contain" />
              </div>
              <span className="sr-only">einstein</span>
            </Button>
          </Link>
        </div>

        {/* User Profile */}
        <div className="flex w-full flex-col items-center gap-2 border-t border-purple-900/20 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-sm font-medium text-white">
            {loading ? <Skeleton className="h-full w-full rounded-full" /> : initials}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg text-gray-400 hover:text-white"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}
