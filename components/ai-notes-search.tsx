"use client"

import type React from "react"

import { useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { searchNotes } from "@/lib/actions/note-actions"
import ReactMarkdown from "react-markdown"

interface AINotesSearchProps {
  userId: string
}

export function AINotesSearch({ userId }: AINotesSearchProps) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const { toast } = useToast()

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
        description: "There was an error searching your notes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Notes Search</CardTitle>
        <CardDescription>Ask questions about your notes using natural language</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="What was the main topic of my CS301 notes?"
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
          <div className="mt-4 flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {searchResult && (
          <div className="mt-4 rounded-md border p-4">
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{searchResult}</ReactMarkdown>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Searches across all your notes using AI to find relevant information
      </CardFooter>
    </Card>
  )
}
