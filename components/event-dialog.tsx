"use client"

import { useState, useEffect } from "react"
import { format, addMonths, addMinutes } from "date-fns"
import { AlertCircle, Plus, Repeat, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Event, Module } from "@/types/calendar"

interface EventDialogProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  modules: Module[]
  onAdd: (event: Omit<Event, "id">) => void
  onUpdate: (eventId: string, event: Partial<Event>) => void
  onDelete: (eventId: string) => void
  initialDate?: Date
}

export function EventDialog({
  isOpen,
  onClose,
  event,
  modules,
  onAdd,
  onUpdate,
  onDelete,
  initialDate,
}: EventDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>("personal")
  const [moduleId, setModuleId] = useState<string | null>(null)
  const [date, setDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [links, setLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState("")
  const [notes, setNotes] = useState("")
  const [reminders, setReminders] = useState<string[]>([])
  const [completed, setCompleted] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly")
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceEndType, setRecurrenceEndType] = useState<"never" | "after" | "on">("never")
  const [recurrenceCount, setRecurrenceCount] = useState(10)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date>(addMonths(new Date(), 3))
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([])
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [activeTab, setActiveTab] = useState<"details" | "recurrence">("details")

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || "")
      setCategory(event.category)
      setModuleId(event.moduleId)
      setDate(event.start)
      setStartTime(format(event.start, "HH:mm"))
      setEndTime(format(event.end, "HH:mm"))
      setLinks(event.links || [])
      setNotes(event.notes || "")
      setReminders(event.reminders || [])
      setCompleted(event.completed || false)
      setPriority(event.priority || "medium")

      // Set recurrence
      if (event.recurrence) {
        setIsRecurring(true)
        setRecurrenceFrequency(event.recurrence.frequency)
        setRecurrenceInterval(event.recurrence.interval)

        if (event.recurrence.count) {
          setRecurrenceEndType("after")
          setRecurrenceCount(event.recurrence.count)
        } else if (event.recurrence.endDate) {
          setRecurrenceEndType("on")
          setRecurrenceEndDate(event.recurrence.endDate)
        } else {
          setRecurrenceEndType("never")
        }

        if (event.recurrence.daysOfWeek) {
          setSelectedDaysOfWeek(event.recurrence.daysOfWeek)
        }

        if (event.recurrence.dayOfMonth) {
          setDayOfMonth(event.recurrence.dayOfMonth)
        }
      } else {
        setIsRecurring(false)
        setRecurrenceFrequency("weekly")
        setRecurrenceInterval(1)
        setRecurrenceEndType("never")
        setRecurrenceCount(10)
        setRecurrenceEndDate(addMonths(new Date(), 3))
        setSelectedDaysOfWeek([])
        setDayOfMonth(1)
      }
    } else {
      setTitle("")
      setDescription("")
      setCategory("personal")
      setModuleId(null)
      setDate(initialDate || new Date())
      setStartTime("09:00")
      setEndTime("10:00")
      setLinks([])
      setNotes("")
      setReminders([])
      setCompleted(false)
      setPriority("medium")
      setIsRecurring(false)
      setRecurrenceFrequency("weekly")
      setRecurrenceInterval(1)
      setRecurrenceEndType("never")
      setRecurrenceCount(10)
      setRecurrenceEndDate(addMonths(new Date(), 3))
      setSelectedDaysOfWeek([])
      setDayOfMonth(1)
    }

    setActiveTab("details")
  }, [event, isOpen, initialDate])

  // Handle start time change and adjust end time if needed
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime)

    // Parse times to compare them
    const [startHours, startMinutes] = newStartTime.split(":").map(Number)
    const [endHours, endMinutes] = endTime.split(":").map(Number)

    const startDate = new Date()
    startDate.setHours(startHours, startMinutes, 0, 0)

    const endDate = new Date()
    endDate.setHours(endHours, endMinutes, 0, 0)

    // If end time is before or equal to start time, set end time to start time + 1 hour
    if (endDate <= startDate) {
      const newEndDate = addMinutes(startDate, 60)
      setEndTime(format(newEndDate, "HH:mm"))
    }
  }

  const handleAddLink = () => {
    if (newLink && !links.includes(newLink)) {
      setLinks([...links, newLink])
      setNewLink("")
    }
    setShowLinkInput(false)
  }

  const handleRemoveLink = (linkToRemove: string) => {
    setLinks(links.filter((link) => link !== linkToRemove))
  }

  const handleSave = () => {
    // Create start and end date objects
    const [startHours, startMinutes] = startTime.split(":").map(Number)
    const [endHours, endMinutes] = endTime.split(":").map(Number)

    const startDate = new Date(date)
    startDate.setHours(startHours, startMinutes, 0)

    const endDate = new Date(date)
    endDate.setHours(endHours, endMinutes, 0)

    // Build recurrence object if recurring
    const recurrence = isRecurring
      ? {
          frequency: recurrenceFrequency,
          interval: recurrenceInterval,
          ...(recurrenceEndType === "after" ? { count: recurrenceCount } : {}),
          ...(recurrenceEndType === "on" ? { endDate: recurrenceEndDate } : {}),
          ...(recurrenceFrequency === "weekly"
            ? { daysOfWeek: selectedDaysOfWeek.length ? selectedDaysOfWeek : [date.getDay()] }
            : {}),
          ...(recurrenceFrequency === "monthly" ? { dayOfMonth: dayOfMonth } : {}),
        }
      : undefined

    const eventData = {
      title,
      description,
      category,
      moduleId,
      start: startDate,
      end: endDate,
      links,
      notes,
      reminders,
      completed,
      priority,
      recurrence,
    }

    if (event) {
      onUpdate(event.id, eventData)
    } else {
      onAdd(eventData as Omit<Event, "id">)
    }

    onClose()
  }

  const handleDelete = () => {
    if (event) {
      onDelete(event.id)
      onClose()
    }
  }

  const toggleDayOfWeek = (day: number) => {
    if (selectedDaysOfWeek.includes(day)) {
      setSelectedDaysOfWeek(selectedDaysOfWeek.filter((d) => d !== day))
    } else {
      setSelectedDaysOfWeek([...selectedDaysOfWeek, day])
    }
  }

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Add Event"}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="recurrence">Recurrence</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="module">Module (Optional)</Label>
                <Select value={moduleId || ""} onValueChange={setModuleId} disabled={category !== "school"}>
                  <SelectTrigger id="module">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.code} - {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <RadioGroup
                value={priority}
                onValueChange={(value) => setPriority(value as "low" | "medium" | "high")}
                className="flex space-x-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="priority-low" />
                  <Label htmlFor="priority-low">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="priority-medium" />
                  <Label htmlFor="priority-medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="priority-high" />
                  <Label htmlFor="priority-high" className="flex items-center">
                    High
                    <AlertCircle className="ml-1 h-4 w-4 text-destructive" />
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {format(date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Links (Optional)</Label>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={link} readOnly className="flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveLink(link)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {showLinkInput ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={handleAddLink}>
                      Add
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setShowLinkInput(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Link
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes"
                className="min-h-[80px]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="completed"
                checked={completed}
                onCheckedChange={(checked) => setCompleted(checked === true)}
              />
              <Label htmlFor="completed">Mark as completed</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked === true)}
              />
              <Label htmlFor="recurring" className="flex items-center">
                <Repeat className="mr-2 h-4 w-4" />
                Recurring event
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="recurrence" className="space-y-4 py-4">
            {!isRecurring ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Repeat className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium">This is not a recurring event</h3>
                <p className="mt-2">Enable recurrence in the Details tab to configure repetition settings.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Repeat every</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(Number.parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Select value={recurrenceFrequency} onValueChange={(value) => setRecurrenceFrequency(value as any)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Day(s)</SelectItem>
                        <SelectItem value="weekly">Week(s)</SelectItem>
                        <SelectItem value="monthly">Month(s)</SelectItem>
                        <SelectItem value="yearly">Year(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {recurrenceFrequency === "weekly" && (
                  <div className="space-y-2">
                    <Label>Repeat on</Label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day, index) => (
                        <Button
                          key={day}
                          type="button"
                          variant={selectedDaysOfWeek.includes(index) ? "default" : "outline"}
                          className="w-12 h-12 rounded-full"
                          onClick={() => toggleDayOfWeek(index)}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {recurrenceFrequency === "monthly" && (
                  <div className="space-y-2">
                    <Label>Day of month</Label>
                    <Select
                      value={dayOfMonth.toString()}
                      onValueChange={(value) => setDayOfMonth(Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysInMonth.map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Ends</Label>
                  <RadioGroup value={recurrenceEndType} onValueChange={(value) => setRecurrenceEndType(value as any)}>
                    <div className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value="never" id="never" />
                      <Label htmlFor="never">Never</Label>
                    </div>
                    <div className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value="after" id="after" />
                      <Label htmlFor="after" className="flex items-center gap-2">
                        After
                        <Input
                          type="number"
                          min="1"
                          value={recurrenceCount}
                          onChange={(e) => setRecurrenceCount(Number.parseInt(e.target.value) || 1)}
                          className="w-20"
                          disabled={recurrenceEndType !== "after"}
                        />
                        occurrences
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value="on" id="on" />
                      <Label htmlFor="on" className="flex items-center gap-2">
                        On
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`${recurrenceEndType !== "on" ? "opacity-50" : ""}`}
                              disabled={recurrenceEndType !== "on"}
                            >
                              {format(recurrenceEndDate, "PPP")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={recurrenceEndDate}
                              onSelect={(date) => date && setRecurrenceEndDate(date)}
                              initialFocus
                              disabled={recurrenceEndType !== "on"}
                            />
                          </PopoverContent>
                        </Popover>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between sm:justify-between">
          {event && (
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
