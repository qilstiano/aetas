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
      await supabase.auth.signOut()
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
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
        } = await supabase.auth.onAuthStateChange(async (event, session) => {
          setUser(session?.user || null)

          if (event === "TOKEN_REFRESHED") {
            // Handle token refresh success
            console.log("Token refreshed successfully")
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error: any) {
        // Handle refresh token errors
        if (
          error?.name === "AuthApiError" &&
          error?.status === 400 &&
          (error?.message?.includes("refresh_token") || error?.code === "refresh_token_already_used")
        ) {
          toast({
            title: "Session expired",
            description: "Please sign in again",
            variant: "destructive",
          })

          // Clear the session and redirect to login
          await supabase.auth.signOut()
          router.push("/login")
        } else {
          console.error("Auth provider error:", error)
        }
      } finally {
        setLoading(false)
      }
    }

    setupAuth()
  }, [router, toast, supabase.auth])

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
