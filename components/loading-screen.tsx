"use client"

import { useEffect, useState } from "react"

interface LoadingScreenProps {
  isLoading: boolean
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      // Add a small delay before hiding to ensure smooth transition
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)

      // Safety timeout to prevent infinite loading
      const safetyTimer = setTimeout(() => {
        setIsVisible(false)
      }, 10000) // Force hide after 10 seconds

      return () => clearTimeout(safetyTimer)
    }
  }, [isLoading])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[52] flex items-center justify-center bg-black transition-opacity duration-500 ${
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative">
        <div className="absolute -inset-40 animate-pulse-slow rounded-full bg-purple-500/20 blur-3xl"></div>
        <div className="absolute -inset-32 animate-pulse-medium rounded-full bg-purple-600/20 blur-2xl"></div>
        <div className="absolute -inset-20 animate-pulse-fast rounded-full bg-purple-700/30 blur-xl"></div>
        <div className="relative z-10 text-2xl font-bold text-white">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
        </div>
      </div>
    </div>
  )
}
