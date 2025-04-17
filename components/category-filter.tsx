"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type Category = {
  id: string
  name: string
  color: string
}

export function CategoryFilter() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories: Category[] = [
    { id: "all", name: "All", color: "gray-700" },
    { id: "school", name: "School", color: "[#39FF14]" },
    { id: "work", name: "Work", color: "[#00FFFF]" },
    { id: "personal", name: "Personal", color: "purple-500" },
    { id: "other", name: "Other", color: "gray-500" },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Categories</h2>

      <div className="flex flex-col gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant="ghost"
            className={`justify-start text-left h-auto py-2 px-3 ${
              selectedCategory === category.id
                ? `bg-${category.color}/20 text-${category.color} hover:bg-${category.color}/30`
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
            onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
          >
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full bg-${category.color}`} />
              <span>{category.name}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}
