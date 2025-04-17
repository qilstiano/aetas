"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddTaskModal } from "@/components/add-task-modal"

export function AddTaskButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-[#39FF14] hover:bg-[#39FF14]/80 text-black font-medium"
      >
        <Plus className="mr-1 h-4 w-4" /> Add Task
      </Button>

      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
