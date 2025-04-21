"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType {
  user: any | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const signOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear user state
      setUser(null)

      // Navigate to login page
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user || null)

        // Set up auth state change listener
        const {
          data: { subscription },
        } = await supabase.auth.onAuthStateChange((event, session) => {
          console.log("Auth state changed:", event)
          setUser(session?.user || null)

          if (event === "SIGNED_OUT") {
            router.push("/login")
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Auth provider error:", error)
      } finally {
        setLoading(false)
      }
    }

    setupAuth()
  }, [router, supabase.auth])

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
