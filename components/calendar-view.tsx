"use client"

import { format, addDays, subDays, isSameDay } from "date-fns"
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Link, Paperclip, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Event, Module } from "@/types/calendar"

interface CalendarViewProps {
  events: Event[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onEventClick: (event: Event) => void
  onToggleComplete: (eventId: string, completed: boolean) => void
  modules: Module[]
  isLoading: boolean
}

export function CalendarView({
  events,
  selectedDate,
  onDateSelect,
  onEventClick,
  onToggleComplete,
  modules,
  isLoading,
}: CalendarViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const handlePrevDay = () => {
    onDateSelect(subDays(selectedDate, 1))
  }

  const handleNextDay = () => {
    onDateSelect(addDays(selectedDate, 1))
  }

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

  // Group events by hour and handle overlapping events
  const organizeHourEvents = (hourEvents: Event[]) => {
    if (hourEvents.length <= 1) {
      return hourEvents.map((event) => ({ event, column: 0, totalColumns: 1 }))
    }

    // Sort events by start time
    const sortedEvents = [...hourEvents].sort((a, b) => a.start.getTime() - b.start.getTime())

    // Find overlapping events
    const eventGroups: Event[][] = []
    let currentGroup: Event[] = []

    sortedEvents.forEach((event) => {
      if (currentGroup.length === 0) {
        currentGroup.push(event)
        return
      }

      // Check if this event overlaps with any in the current group
      const overlapsWithCurrentGroup = currentGroup.some((groupEvent) => {
        return (
          (event.start < groupEvent.end && event.end > groupEvent.start) || isSameDay(event.start, groupEvent.start)
        )
      })

      if (overlapsWithCurrentGroup) {
        currentGroup.push(event)
      } else {
        eventGroups.push([...currentGroup])
        currentGroup = [event]
      }
    })

    if (currentGroup.length > 0) {
      eventGroups.push(currentGroup)
    }

    // Assign columns to events
    const result: { event: Event; column: number; totalColumns: number }[] = []

    eventGroups.forEach((group) => {
      const totalColumns = group.length

      group.forEach((event, index) => {
        result.push({
          event,
          column: index,
          totalColumns,
        })
      })
    })

    return result
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Daily Schedule</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{format(selectedDate, "EEEE, MMMM d")}</span>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex gap-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-24 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <h3 className="font-medium">No events for today</h3>
              <p className="text-sm text-muted-foreground">Add a new event to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hours.map((hour) => {
                const hourEvents = events.filter((event) => {
                  const eventHour = event.start.getHours()
                  return eventHour === hour
                })

                if (hourEvents.length === 0) {
                  return null
                }

                // Organize events to handle overlapping
                const organizedEvents = organizeHourEvents(hourEvents)

                return (
                  <div key={hour} className="flex gap-4">
                    <div className="w-16 pt-2 text-sm text-muted-foreground">
                      {format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}
                    </div>
                    <div className="flex-1">
                      <div className="relative flex flex-wrap gap-2">
                        {organizedEvents.map(({ event, column, totalColumns }) => (
                          <div
                            key={event.id}
                            className={`rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                              event.completed ? "opacity-60" : ""
                            } ${event.priority === "high" ? "border-destructive" : ""}`}
                            onClick={() => onEventClick(event)}
                            style={{
                              width: `calc(${100 / totalColumns}% - ${4 * (totalColumns - 1)}px)`,
                              zIndex: totalColumns - column, // Higher columns (later events) get higher z-index
                            }}
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
                                    className={`font-medium ${
                                      event.completed ? "line-through text-muted-foreground" : ""
                                    } flex items-center gap-1`}
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
                                  {event.description && (
                                    <p className="text-sm text-muted-foreground">{event.description}</p>
                                  )}
                                </div>
                              </div>
                              <div
                                className={`rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(
                                  event.category,
                                )}`}
                              >
                                {event.category}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                                </span>
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
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
