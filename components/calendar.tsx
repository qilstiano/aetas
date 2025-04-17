"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Sample events data
  const events = [
    {
      id: 1,
      title: "Algorithm Study",
      time: "10:00 AM",
      duration: 60,
      category: "school",
      module: "CS301",
    },
    {
      id: 2,
      title: "Team Meeting",
      time: "2:00 PM",
      duration: 45,
      category: "work",
    },
    {
      id: 3,
      title: "Gym Session",
      time: "6:00 PM",
      duration: 90,
      category: "personal",
    },
  ]

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "school":
        return "border-[#39FF14] bg-[#39FF14]/10"
      case "work":
        return "border-[#00FFFF] bg-[#00FFFF]/10"
      case "personal":
        return "border-purple-500 bg-purple-500/10"
      default:
        return "border-gray-500 bg-gray-500/10"
    }
  }

  const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 8 AM to 9 PM

  const prevDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const nextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Calendar</h2>
        <div className="flex items-center gap-4">
          <button onClick={prevDay} className="p-1 rounded-md hover:bg-gray-800 transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-400" />
          </button>
          <span className="text-gray-300">
            {currentDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <button onClick={nextDay} className="p-1 rounded-md hover:bg-gray-800 transition-colors">
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="relative space-y-1">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_1fr] h-16">
            <div className="text-xs text-gray-500 pt-1">
              {hour % 12 === 0 ? 12 : hour % 12}:00 {hour >= 12 ? "PM" : "AM"}
            </div>
            <div className="border-t border-gray-800 relative">
              {events
                .filter((event) => {
                  const eventHour = Number.parseInt(event.time.split(":")[0])
                  const isPM = event.time.includes("PM")
                  const adjustedHour = isPM && eventHour !== 12 ? eventHour + 12 : eventHour
                  return adjustedHour === hour
                })
                .map((event) => (
                  <div
                    key={event.id}
                    className={`absolute left-0 right-2 p-2 rounded-md border ${getCategoryColor(
                      event.category,
                    )} shadow-lg backdrop-blur-sm transition-transform hover:scale-[1.02] cursor-pointer`}
                    style={{
                      height: `${(event.duration / 60) * 4}rem`,
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white">{event.title}</span>
                      <span className="text-xs text-gray-400">{event.time}</span>
                    </div>
                    {event.module && <span className="text-xs text-[#39FF14]">{event.module}</span>}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
