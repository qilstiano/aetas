"use client"

import { format, isToday, isTomorrow, addDays, isAfter, isBefore, startOfDay } from "date-fns"
import { AlertCircle, Clock, Link, Paperclip, Repeat } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Event, Module } from "@/types/calendar"

interface ListViewProps {
  events: Event[]
  onEventClick: (event: Event) => void
  onToggleComplete: (eventId: string, completed: boolean) => void
  modules: Module[]
  isLoading: boolean
}

export function ListView({ events, onEventClick, onToggleComplete, modules, isLoading }: ListViewProps) {
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const nextWeek = addDays(today, 7)

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime())

  // Group events by time period
  const todayEvents = sortedEvents.filter((event) => isToday(event.start))
  const tomorrowEvents = sortedEvents.filter((event) => isTomorrow(event.start))
  const thisWeekEvents = sortedEvents.filter(
    (event) => isAfter(event.start, tomorrow) && isBefore(event.start, nextWeek),
  )
  const laterEvents = sortedEvents.filter((event) => isAfter(event.start, nextWeek))

  const getModuleById = (moduleId: string | null) => {
    if (!moduleId) return null
    return modules.find((module) => module.id === moduleId)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "school":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "work":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "personal":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const renderEventsList = (eventsList: Event[], title: string) => {
    if (eventsList.length === 0) return null

    return (
      <div className="mb-6">
        <h3 className="mb-3 font-medium">{title}</h3>
        <div className="space-y-2">
          {eventsList.map((event) => (
            <div
              key={event.id}
              className={`rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                event.completed ? "opacity-60" : ""
              } ${event.priority === "high" ? "border-destructive" : ""}`}
              onClick={() => onEventClick(event)}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={event.completed}
                    onCheckedChange={(checked) => {
                      onToggleComplete(event.id, checked === true)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div>
                    <h4
                      className={`font-medium ${event.completed ? "line-through text-muted-foreground" : ""} flex items-center gap-1`}
                    >
                      {event.title}
                      {event.priority === "high" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>High priority</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {event.recurrence && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Repeat className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Recurring event</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </h4>
                    {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                  </div>
                </div>
                <div className={`rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(event.category)}`}>
                  {event.category}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{format(event.start, "MMM d, h:mm a")}</span>
                </div>
                {event.moduleId && (
                  <div className="rounded-full bg-secondary px-2 py-0.5">
                    {getModuleById(event.moduleId)?.code || "Unknown Module"}
                  </div>
                )}
                {event.links && event.links.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Link className="h-3 w-3" />
                    <span>{event.links.length} links</span>
                  </div>
                )}
                {event.notes && (
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    <span>Notes</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-md" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <h3 className="font-medium">No upcoming events</h3>
            <p className="text-sm text-muted-foreground">Add a new event to get started</p>
          </div>
        ) : (
          <div>
            {renderEventsList(todayEvents, "Today")}
            {renderEventsList(tomorrowEvents, "Tomorrow")}
            {renderEventsList(thisWeekEvents, "This Week")}
            {renderEventsList(laterEvents, "Later")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
