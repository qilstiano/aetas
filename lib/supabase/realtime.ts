"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect } from "react"

type RealtimeCallback = () => void

export function useRealtimeSubscription(table: string, userId: string, callback: RealtimeCallback, filter?: string) {
  useEffect(() => {
    const supabase = createClient()

    // Set up filter
    const filterString = filter ? `${filter} AND user_id=eq.${userId}` : `user_id=eq.${userId}`

    // Create subscription
    const subscription = supabase
      .channel(`${table}-changes`)
      .on("postgres_changes", { event: "*", schema: "public", table, filter: filterString }, () => {
        callback()
      })
      .subscribe()

    // Cleanup
    return () => {
      subscription.unsubscribe()
    }
  }, [table, userId, callback, filter])
}
