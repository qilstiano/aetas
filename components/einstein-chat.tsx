"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import ReactMarkdown from "react-markdown"
import { Copy, Check } from "lucide-react"
import Image from "next/image"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface EinsteinChatProps {
  userId: string
}

export function EinsteinChat({ userId }: EinsteinChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [copying, setCopying] = useState<Record<number, boolean>>({})

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setError(null)

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    // Start loading state
    setIsLoading(true)

    try {
      const response = await fetch("/api/einstein", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      const data = await response.json()

      // Add assistant response to chat
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopying({ ...copying, [index]: true })
      toast({
        title: "Copied to clipboard",
        description: "The markdown has been copied to your clipboard",
      })
      setTimeout(() => {
        setCopying({ ...copying, [index]: false })
      }, 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-background/50 backdrop-blur-sm">
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-16 h-16 mb-4 relative">
              <Image src="/einstein-icon.png" alt="einstein" fill className="object-contain" />
            </div>
            <h3 className="text-lg font-medium mb-2">Welcome to einstein</h3>
            <p className="text-muted-foreground max-w-md">
              Ask any question and get AI-powered answers to help with your studies.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className="w-5 h-5 mr-2 relative">
                          <Image src="/einstein-icon.png" alt="einstein" fill className="object-contain" />
                        </div>
                        <span className="text-xs font-medium">einstein</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(message.content, i)}
                        title="Copy markdown"
                      >
                        {copying[i] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  )}
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                  <div className="flex items-center">
                    <div className="w-5 h-5 mr-2 relative">
                      <Image src="/einstein-icon.png" alt="einstein" fill className="object-contain" />
                    </div>
                    <span className="text-xs font-medium">einstein</span>
                  </div>
                  <div className="mt-2 flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                    <div
                      className="w-2 h-2 rounded-full bg-current animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-current animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <div className="max-w-[80%] rounded-lg p-4 bg-destructive/10 text-destructive">
                  <p>Error: {error}</p>
                  <p className="text-xs mt-1">Please try again or refresh the page.</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask einstein a question..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Press Enter to send, Shift+Enter for a new line</p>
      </form>
    </div>
  )
}
