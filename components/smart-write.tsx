"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Copy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import ReactMarkdown from "react-markdown"
import { searchNotes } from "@/lib/actions/einstein-actions"

interface SmartWriteProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onInsert: (content: string) => void
}

export function SmartWrite({ userId, isOpen, onClose, onInsert }: SmartWriteProps) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) return

    setIsSearching(true)
    setSearchResult(null)

    try {
      const result = await searchNotes(userId, query)
      setSearchResult(result)
    } catch (error) {
      console.error("Error searching notes:", error)
      toast({
        title: "Search failed",
        description: "There was an error with your search. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleCopy = () => {
    if (searchResult) {
      navigator.clipboard.writeText(searchResult)
      toast({
        title: "Copied to clipboard",
        description: "The content has been copied to your clipboard.",
      })
    }
  }

  const handleInsert = () => {
    if (searchResult) {
      onInsert(searchResult)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden" ref={containerRef}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Smart Write</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Ask AI to generate content for you..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              disabled={isSearching}
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>

          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {searchResult && (
            <div className="overflow-auto max-h-[50vh]">
              <div className="rounded-md border p-4 mb-4">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{searchResult}</ReactMarkdown>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button onClick={handleInsert}>Insert into Editor</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
