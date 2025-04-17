"use client"

import { useState } from "react"
import { CalendarDays, ListTodo } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ViewToggle() {
  const [activeView, setActiveView] = useState<"calendar" | "list">("calendar")

  return (
    <div className="flex bg-gray-800 rounded-md p-1">
      <Button
        variant="ghost"
        size="sm"
        className={`flex items-center gap-1 ${
          activeView === "calendar" ? "bg-gray-700 text-[#39FF14]" : "text-gray-400 hover:text-white"
        }`}
        onClick={() => setActiveView("calendar")}
      >
        <CalendarDays className="h-4 w-4" />
        <span className="hidden sm:inline">Calendar</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={`flex items-center gap-1 ${
          activeView === "list" ? "bg-gray-700 text-[#00FFFF]" : "text-gray-400 hover:text-white"
        }`}
        onClick={() => setActiveView("list")}
      >
        <ListTodo className="h-4 w-4" />
        <span className="hidden sm:inline">List</span>
      </Button>
    </div>
  )
}
