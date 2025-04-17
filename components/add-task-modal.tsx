"use client"

import { X, Link, Paperclip, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddTaskModal({ isOpen, onClose }: AddTaskModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-xl animate-in fade-in duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Add New Task</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-400">
              Title
            </label>
            <Input
              id="title"
              placeholder="Task title"
              className="bg-gray-800 border-gray-700 focus-visible:ring-[#39FF14] text-white"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-400">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              placeholder="Add details about your task"
              className="bg-gray-800 border-gray-700 focus-visible:ring-[#39FF14] text-white min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-gray-400">
                Category
              </label>
              <Select>
                <SelectTrigger className="bg-gray-800 border-gray-700 focus:ring-[#39FF14] text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="module" className="text-sm font-medium text-gray-400">
                Module (Optional)
              </label>
              <Select>
                <SelectTrigger className="bg-gray-800 border-gray-700 focus:ring-[#39FF14] text-white">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="cs301">CS301</SelectItem>
                  <SelectItem value="cs305">CS305</SelectItem>
                  <SelectItem value="cs401">CS401</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium text-gray-400">
                Date
              </label>
              <Input
                id="date"
                type="date"
                className="bg-gray-800 border-gray-700 focus-visible:ring-[#39FF14] text-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="time" className="text-sm font-medium text-gray-400">
                Time
              </label>
              <Input
                id="time"
                type="time"
                className="bg-gray-800 border-gray-700 focus-visible:ring-[#39FF14] text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <Link className="mr-1 h-4 w-4" /> Add Link
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <Paperclip className="mr-1 h-4 w-4" /> Add File
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <Bell className="mr-1 h-4 w-4" /> Reminder
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-800">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-gray-800">
            Cancel
          </Button>
          <Button className="bg-[#39FF14] hover:bg-[#39FF14]/80 text-black font-medium">Create Task</Button>
        </div>
      </div>
    </div>
  )
}
