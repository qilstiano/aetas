"use client"

import { useState, useEffect } from "react"
import { format, startOfToday, startOfWeek, isSameDay } from "date-fns"
import { CalendarDays, ListTodo, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { MainLayout } from "@/components/main-layout"
import { CalendarView } from "@/components/calendar-view"
import { ListView } from "@/components/list-view"
import { ModuleOverview } from "@/components/module-overview"
import { EventDialog } from "@/components/event-dialog"
import type { Event, Module } from "@/types/calendar"

interface CalendarDashboardProps {
  user: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
    }
  }
}

export function CalendarDashboard({ user }: CalendarDashboardProps) {
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [selectedDate, setSelectedDate] = useState(startOfToday())
  const [view, setView] = useState<"calendar" | "list">("calendar")
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
          start: new Date(event.start_time),
          end: new Date(event.end_time),
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
          color: module.color || "#3b82f6",
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

  const handleToggleComplete = async (eventId: string, completed: boolean) => {
    await handleUpdateEvent(eventId, { completed })
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setIsDialogOpen(true)
  }

  const handleNewEvent = () => {
    setSelectedEvent(null)
    setIsDialogOpen(true)
  }

  const filteredEvents = events.filter((event) => {
    if (view === "calendar") {
      return isSameDay(event.start, selectedDate)
    } else {
      // For list view, show events for the current week and beyond
      const start = startOfWeek(new Date())
      return event.start >= start
    }
  })

  return (
    <MainLayout user={{ id: user.id, email: user.email, full_name: user.user_metadata?.full_name }}>
      <div className="container py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {view === "calendar" ? format(selectedDate, "MMMM d, yyyy") : "Upcoming Events"}
          </h1>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              <Button
                variant={view === "calendar" ? "default" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setView("calendar")}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Calendar
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setView("list")}
              >
                <ListTodo className="mr-2 h-4 w-4" />
                List
              </Button>
            </div>

            <Button onClick={handleNewEvent}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
          <div className="md:col-span-2 lg:col-span-3">
            {view === "calendar" ? (
              <CalendarView
                events={filteredEvents}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onEventClick={handleEditEvent}
                onToggleComplete={handleToggleComplete}
                modules={modules}
                isLoading={isLoading}
              />
            ) : (
              <ListView
                events={events}
                onEventClick={handleEditEvent}
                onToggleComplete={handleToggleComplete}
                modules={modules}
                isLoading={isLoading}
              />
            )}
          </div>

          <div>
            <ModuleOverview modules={modules} events={events} onEventClick={handleEditEvent} userId={user.id} />
          </div>
        </div>
      </div>

      <EventDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        event={selectedEvent}
        modules={modules}
        onAdd={handleAddEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />
    </MainLayout>
  )
}
