"use client"

import { useState, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { EventDialog } from "@/components/event-dialog"
import type { Event, Module } from "@/types/calendar"

interface CalendarPageProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
    }
  }
}

export function CalendarPage({ user }: CalendarPageProps) {
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week">("month")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Fetch events
    const fetchEvents = async () => {
      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .eq("user_id", user.id)
          .order("start_time", { ascending: true })

        if (eventsError) throw eventsError

        const formattedEvents: Event[] = eventsData.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description || "",
          start: parseISO(event.start_time),
          end: parseISO(event.end_time),
          category: event.category,
          moduleId: event.module_id,
          links: (event.links as string[]) || [],
          notes: event.notes || "",
          reminders: (event.reminders as string[]) || [],
          completed: event.completed,
        }))

        setEvents(formattedEvents)
      } catch (error) {
        console.error("Error fetching events:", error)
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        })
      }
    }

    // Fetch modules
    const fetchModules = async () => {
      try {
        const { data: modulesData, error: modulesError } = await supabase
          .from("modules")
          .select("*")
          .eq("user_id", user.id)
          .order("name", { ascending: true })

        if (modulesError) throw modulesError

        const formattedModules: Module[] = modulesData.map((module) => ({
          id: module.id,
          name: module.name,
          code: module.code,
          color: module.color || "#9333ea",
        }))

        setModules(formattedModules)
      } catch (error) {
        console.error("Error fetching modules:", error)
        toast({
          title: "Error",
          description: "Failed to load modules",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
    fetchModules()

    // Set up real-time subscriptions
    const eventsSubscription = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `user_id=eq.${user.id}` },
        () => {
          fetchEvents()
        },
      )
      .subscribe()

    const modulesSubscription = supabase
      .channel("modules-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "modules", filter: `user_id=eq.${user.id}` },
        () => {
          fetchModules()
        },
      )
      .subscribe()

    return () => {
      eventsSubscription.unsubscribe()
      modulesSubscription.unsubscribe()
    }
  }, [user.id, supabase, toast])

  const handleAddEvent = async (eventData: Omit<Event, "id">) => {
    try {
      const { error } = await supabase.from("events").insert({
        user_id: user.id,
        title: eventData.title,
        description: eventData.description,
        start_time: eventData.start.toISOString(),
        end_time: eventData.end.toISOString(),
        category: eventData.category,
        module_id: eventData.moduleId,
        links: eventData.links,
        notes: eventData.notes,
        reminders: eventData.reminders,
        completed: eventData.completed,
      })

      if (error) throw error

      toast({
        title: "Event added",
        description: "Your event has been added successfully.",
      })
    } catch (error) {
      console.error("Error adding event:", error)
      toast({
        title: "Error",
        description: "There was an error adding your event.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateEvent = async (eventId: string, eventData: Partial<Event>) => {
    try {
      const updateData: any = { ...eventData }

      // Convert Date objects to ISO strings
      if (eventData.start) {
        updateData.start_time = eventData.start.toISOString()
        delete updateData.start
      }

      if (eventData.end) {
        updateData.end_time = eventData.end.toISOString()
        delete updateData.end
      }

      // Rename moduleId to module_id
      if ("moduleId" in updateData) {
        updateData.module_id = updateData.moduleId
        delete updateData.moduleId
      }

      const { error } = await supabase.from("events").update(updateData).eq("id", eventId)

      if (error) throw error

      toast({
        title: "Event updated",
        description: "Your event has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating event:", error)
      toast({
        title: "Error",
        description: "There was an error updating your event.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId)

      if (error) throw error

      toast({
        title: "Event deleted",
        description: "Your event has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "There was an error deleting your event.",
        variant: "destructive",
      })
    }
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsDialogOpen(true)
  }

  const handleNewEvent = (date?: Date) => {
    setSelectedEvent(null)
    setIsDialogOpen(true)
  }

  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(subWeeks(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1))
    } else {
      setCurrentDate(addWeeks(currentDate, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Update the renderMonthView function to highlight the current week and today's date
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const today = new Date()

    const dateFormat = "d"
    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""

    // Days of week header
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const daysHeader = daysOfWeek.map((dayName) => (
      <div key={dayName} className="text-center font-medium py-2">
        {dayName}
      </div>
    ))

    // Determine the start and end of the current week
    const currentWeekStart = startOfWeek(today)
    const currentWeekEnd = endOfWeek(today)

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat)
        const cloneDay = day
        const dayEvents = events.filter((event) => isSameDay(event.start, cloneDay))
        const isToday = isSameDay(day, today)
        const isCurrentWeek = day >= currentWeekStart && day <= currentWeekEnd

        days.push(
          <div
            key={day.toString()}
            className={`calendar-day border ${
              !isSameMonth(day, monthStart)
                ? "text-muted-foreground bg-muted/30"
                : isToday
                  ? "bg-primary/10 border-primary"
                  : ""
            } ${isCurrentWeek ? "border-purple-500/50" : ""}`}
            onClick={() => handleNewEvent(cloneDay)}
          >
            <div className="calendar-day-header">
              <span
                className={`text-sm ${
                  isToday
                    ? "h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                    : ""
                }`}
              >
                {formattedDate}
              </span>
            </div>
            <div className="calendar-day-events">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className={`calendar-event ${event.completed ? "opacity-50" : ""} bg-primary/20 hover:bg-primary/30`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEventClick(event)
                  }}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">+{dayEvents.length - 3} more</div>
              )}
            </div>
          </div>,
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="calendar-grid">
          {days}
        </div>,
      )
      days = []
    }

    return (
      <div>
        <div className="calendar-grid mb-1">{daysHeader}</div>
        <div className="max-h-[calc(100vh-250px)] overflow-y-auto">{rows}</div>
      </div>
    )
  }

  // Update the renderWeekView function to add a max height and overflow
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(weekStart)
    const today = new Date()

    const daysOfWeek = []
    let day = weekStart

    // Create array of days in the week
    while (day <= weekEnd) {
      daysOfWeek.push(day)
      day = addDays(day, 1)
    }

    // Days of week header
    const daysHeader = daysOfWeek.map((day) => {
      const isToday = isSameDay(day, today)
      return (
        <div key={day.toString()} className="text-center font-medium py-2">
          <div>{format(day, "EEE")}</div>
          <div
            className={`text-sm ${
              isToday
                ? "h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground mx-auto"
                : ""
            }`}
          >
            {format(day, "d")}
          </div>
        </div>
      )
    })

    // Hours grid
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div>
        <div className="calendar-grid mb-1">{daysHeader}</div>
        <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
          {hours.map((hour) => (
            <div key={hour} className="flex border-t">
              <div className="w-16 py-2 text-xs text-muted-foreground text-right pr-2">
                {format(new Date().setHours(hour, 0, 0, 0), "h a")}
              </div>
              <div className="flex-1 grid grid-cols-7 min-h-[60px]">
                {daysOfWeek.map((day) => {
                  const hourEvents = events.filter((event) => {
                    const eventHour = event.start.getHours()
                    return isSameDay(event.start, day) && eventHour === hour
                  })

                  return (
                    <div
                      key={day.toString()}
                      className="border-l relative"
                      onClick={() => {
                        const newDate = new Date(day)
                        newDate.setHours(hour)
                        handleNewEvent(newDate)
                      }}
                    >
                      {hourEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`absolute inset-x-0 mx-1 p-1 text-xs rounded ${
                            event.completed ? "opacity-50" : ""
                          } bg-primary/20 hover:bg-primary/30 cursor-pointer`}
                          style={{
                            top: `${(event.start.getMinutes() / 60) * 100}%`,
                            height: `${Math.max(
                              10,
                              ((event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)) * 100,
                            )}%`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEventClick(event)
                          }}
                        >
                          <div className="truncate font-medium">{event.title}</div>
                          <div className="truncate text-muted-foreground">{format(event.start, "h:mm a")}</div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {view === "month" ? format(currentDate, "MMMM yyyy") : `Week of ${format(startOfWeek(currentDate), "MMM d")}`}
        </h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => handleNewEvent()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-[600px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div>{view === "month" ? renderMonthView() : renderWeekView()}</div>
          )}
        </CardContent>
      </Card>

      <EventDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        event={selectedEvent}
        modules={modules}
        onAdd={handleAddEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        initialDate={selectedEvent?.start || currentDate}
      />
    </div>
  )
}
