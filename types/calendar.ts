export interface Event {
  id: string
  title: string
  description: string
  start: Date
  end: Date
  category: string
  moduleId: string | null
  links: string[]
  notes: string
  reminders: string[]
  completed: boolean
  priority?: "low" | "medium" | "high"
  importance?: "low" | "medium" | "high"
  urgency?: "low" | "medium" | "high"
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly"
    interval: number
    endDate?: Date
    count?: number
    daysOfWeek?: number[] // 0 = Sunday, 1 = Monday, etc.
    dayOfMonth?: number
    monthOfYear?: number
  }
  isRecurringInstance?: boolean
}

export interface Module {
  id: string
  name: string
  code: string
  color: string
}

export interface Note {
  id: string
  title: string
  content: string
  moduleId: string | null
  createdAt: Date
  updatedAt: Date
}
