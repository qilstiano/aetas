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
}
