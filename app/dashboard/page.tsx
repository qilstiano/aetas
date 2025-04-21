"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, List, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { MainLayout } from "@/components/main-layout"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeView, setActiveView] = useState<"calendar" | "list">("calendar")
  const supabase = createClient()

  useEffect(() => {
    const checkUserSettings = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single()

        if (error) {
          throw error
        }

        if (!data) {
          // Create default settings if none exist
          const { error: insertError } = await supabase.from("user_settings").insert({
            user_id: user.id,
            email_notifications: true,
            push_notifications: true,
            theme: "dark",
          })

          if (insertError) throw insertError
        }
      } catch (error: any) {
        console.error("Error checking user settings:", error)
        toast({
          title: "Error loading settings",
          description: error.message || "There was a problem loading your settings",
          variant: "destructive",
        })
      }
    }

    if (user) {
      checkUserSettings()
    }
  }, [user, supabase, toast])

  const handlePrevDay = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() - 1)
      return newDate
    })
  }

  const handleNextDay = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + 1)
      return newDate
    })
  }

  if (loading) {
    return null // MainLayout already handles loading state
  }

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-6">
          <h1 className="text-4xl font-bold text-white">{format(currentDate, "MMMM d, yyyy")}</h1>
          <div className="flex items-center gap-4">
            <div className="flex overflow-hidden rounded-lg border border-purple-900/30 bg-black/20">
              <Button
                variant="ghost"
                className={`rounded-none px-4 py-2 ${
                  activeView === "calendar" ? "bg-purple-600 text-white" : "text-gray-400"
                }`}
                onClick={() => setActiveView("calendar")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Calendar
              </Button>
              <Button
                variant="ghost"
                className={`rounded-none px-4 py-2 ${
                  activeView === "list" ? "bg-purple-600 text-white" : "text-gray-400"
                }`}
                onClick={() => setActiveView("list")}
              >
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 gap-6 overflow-hidden p-6">
          {/* Daily Schedule */}
          <div className="flex flex-1 flex-col rounded-lg border border-purple-900/30 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-purple-900/30 p-4">
              <h2 className="text-xl font-semibold text-white">Daily Schedule</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevDay}
                  className="h-8 w-8 rounded-full border-purple-900/30 bg-transparent"
                >
                  <span className="sr-only">Previous day</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevron-left"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </Button>
                <span className="text-sm font-medium text-gray-300">{format(currentDate, "EEEE, MMMM d")}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextDay}
                  className="h-8 w-8 rounded-full border-purple-900/30 bg-transparent"
                >
                  <span className="sr-only">Next day</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevron-right"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Button>
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <p className="mb-2 text-lg font-medium text-gray-300">No events for today</p>
              <p className="text-sm text-gray-400">Add a new event to get started</p>
            </div>
          </div>

          {/* Modules */}
          <div className="w-80 rounded-lg border border-purple-900/30 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-purple-900/30 p-4">
              <h2 className="text-xl font-semibold text-white">Modules</h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add</span>
              </Button>
            </div>
            <div className="p-4">
              <div className="rounded-lg border border-purple-900/30 bg-black/40 p-4">
                <h3 className="font-semibold text-white">MUFG Internship</h3>
                <p className="text-sm text-gray-400">ATAP</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-purple-400">0 tasks</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 rounded-full p-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-more-horizontal"
                      >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                      <span className="sr-only">More options</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 rounded-full p-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-chevron-down"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                      <span className="sr-only">Expand</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
