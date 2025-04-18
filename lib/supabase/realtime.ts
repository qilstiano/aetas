"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

type RealtimeCallback = () => void

export function useRealtimeSubscription(table: string, userId: string, callback: RealtimeCallback, filter?: string) {
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Set up filter
    const filterString = filter ? `${filter} AND user_id=eq.${userId}` : `user_id=eq.${userId}`

    // Create subscription
    const subscription = supabase
      .channel(`${table}-changes-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table, filter: filterString }, () => {
        callback()
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsSubscribed(true)
        }
      })

    // Cleanup
    return () => {
      subscription.unsubscribe()
    }
  }, [table, userId, callback, filter])

  return isSubscribed
}

// Optimistic update helper
export function optimisticUpdate<T extends { id: string }>(
  items: T[],
  newItem: T,
  action: "add" | "update" | "delete",
): T[] {
  switch (action) {
    case "add":
      return [...items, newItem]
    case "update":
      return items.map((item) => (item.id === newItem.id ? newItem : item))
    case "delete":
      return items.filter((item) => item.id !== newItem.id)
    default:
      return items
  }
}
