"use client"

import { useState } from "react"
import { Check, Clock, Link, MoreHorizontal, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Task = {
  id: number
  title: string
  description?: string
  category: "personal" | "work" | "school" | "other"
  deadline?: string
  completed: boolean
  module?: string
  hasAttachments?: boolean
  hasLinks?: boolean
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Complete Research Paper",
      description: "Finish the literature review section",
      category: "school",
      deadline: "Tomorrow, 11:59 PM",
      completed: false,
      module: "CS401",
      hasAttachments: true,
      hasLinks: true,
    },
    {
      id: 2,
      title: "Weekly Team Standup",
      description: "Prepare project status update",
      category: "work",
      deadline: "Today, 3:00 PM",
      completed: false,
    },
    {
      id: 3,
      title: "Gym Session",
      category: "personal",
      completed: false,
    },
    {
      id: 4,
      title: "Database Assignment",
      description: "Complete SQL queries",
      category: "school",
      deadline: "Friday, 5:00 PM",
      completed: false,
      module: "CS305",
      hasLinks: true,
    },
  ])

  const toggleTaskCompletion = (id: number) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "school":
        return "bg-[#39FF14]/20 text-[#39FF14]"
      case "work":
        return "bg-[#00FFFF]/20 text-[#00FFFF]"
      case "personal":
        return "bg-purple-500/20 text-purple-500"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Upcoming Tasks</h2>
        <Button
          variant="outline"
          className="text-xs bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          View All
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded-lg border border-gray-800 bg-gray-900/80 backdrop-blur-sm transition-all ${
              task.completed ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <button
                  onClick={() => toggleTaskCompletion(task.id)}
                  className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-md border ${
                    task.completed ? "bg-[#39FF14] border-[#39FF14]" : "border-gray-600 hover:border-[#39FF14]"
                  } flex items-center justify-center transition-colors`}
                >
                  {task.completed && <Check className="h-3 w-3 text-black" />}
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-white"}`}>
                      {task.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(task.category)}`}>
                      {task.category}
                    </span>
                    {task.module && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{task.module}</span>
                    )}
                  </div>

                  {task.description && <p className="text-sm text-gray-400">{task.description}</p>}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {task.deadline && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{task.deadline}</span>
                      </div>
                    )}

                    {task.hasAttachments && (
                      <div className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        <span>2 files</span>
                      </div>
                    )}

                    {task.hasLinks && (
                      <div className="flex items-center gap-1">
                        <Link className="h-3 w-3" />
                        <span>3 links</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-gray-300">
                  <DropdownMenuItem className="hover:text-[#39FF14] cursor-pointer">Edit</DropdownMenuItem>
                  <DropdownMenuItem className="hover:text-[#39FF14] cursor-pointer">Set Reminder</DropdownMenuItem>
                  <DropdownMenuItem className="hover:text-red-500 cursor-pointer">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
