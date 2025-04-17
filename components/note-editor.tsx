"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { Bold, Clock, Code, Italic, List, ListOrdered, ImageIcon, LinkIcon, Save, Trash, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Module, Note } from "@/types/calendar"
import ReactMarkdown from "react-markdown"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface NoteEditorProps {
  note: Note | null
  modules: Module[]
  onSave: (noteId: string, note: { title: string; content: string; moduleId: string | null }) => void
  onDelete: (noteId: string) => void
  onCancel: () => void
}

export function NoteEditor({ note, modules, onSave, onDelete, onCancel }: NoteEditorProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [moduleId, setModuleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const dropZoneRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content || "")
      setModuleId(note.moduleId)
      setLastSaved(note.updatedAt)
    } else {
      setTitle("")
      setContent("")
      setModuleId(null)
      setLastSaved(null)
    }
  }, [note])

  const handleSave = () => {
    const trimmedTitle = (title ?? "").trim()

    if (!trimmedTitle) {
      toast({
        title: "Error",
        description: "Note title cannot be empty",
        variant: "destructive",
      })
      return
    }

    const noteId = note?.id || ""
    onSave(noteId, { title: trimmedTitle, content, moduleId })
    setLastSaved(new Date())
  }

  const handleDelete = () => {
    if (note) {
      onDelete(note.id)
    }
  }

  const insertMarkdown = (markdownSyntax: string, placeholder = "") => {
    const textarea = document.getElementById("markdown-content") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const text = selectedText || placeholder

    let newContent = ""
    let newCursorPos = 0

    switch (markdownSyntax) {
      case "**":
        newContent = content.substring(0, start) + `**${text}**` + content.substring(end)
        newCursorPos = start + 2 + text.length
        break
      case "*":
        newContent = content.substring(0, start) + `*${text}*` + content.substring(end)
        newCursorPos = start + 1 + text.length
        break
      case "`":
        newContent = content.substring(0, start) + `\`${text}\`` + content.substring(end)
        newCursorPos = start + 1 + text.length
        break
      case "```":
        newContent = content.substring(0, start) + `\`\`\`\n${text}\n\`\`\`` + content.substring(end)
        newCursorPos = start + 4 + text.length
        break
      case "- ":
        newContent = content.substring(0, start) + `- ${text}` + content.substring(end)
        newCursorPos = start + 2 + text.length
        break
      case "1. ":
        newContent = content.substring(0, start) + `1. ${text}` + content.substring(end)
        newCursorPos = start + 3 + text.length
        break
      case "![](url)":
        newContent = content.substring(0, start) + `![${text}](url)` + content.substring(end)
        newCursorPos = start + 4 + text.length
        break
      case "[](url)":
        newContent = content.substring(0, start) + `[${text}](url)` + content.substring(end)
        newCursorPos = start + 1 + text.length
        break
      default:
        return
    }

    setContent(newContent)

    // Set focus and cursor position after state update
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Only image files are supported",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Generate a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `notes/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from("images").upload(filePath, file)

      if (error) throw error

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath)

      // Insert image markdown at cursor position
      const textarea = document.getElementById("markdown-content") as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const imageMarkdown = `![${file.name}](${publicUrl})`
        const newContent = content.substring(0, start) + imageMarkdown + content.substring(end)
        setContent(newContent)
      }

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Handle drag and drop
  useEffect(() => {
    const textarea = dropZoneRef.current
    if (!textarea) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      textarea.classList.add("border-primary")
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      textarea.classList.remove("border-primary")
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      textarea.classList.remove("border-primary")

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0])
      }
    }

    textarea.addEventListener("dragover", handleDragOver)
    textarea.addEventListener("dragleave", handleDragLeave)
    textarea.addEventListener("drop", handleDrop)

    return () => {
      textarea.removeEventListener("dragover", handleDragOver)
      textarea.removeEventListener("dragleave", handleDragLeave)
      textarea.removeEventListener("drop", handleDrop)
    }
  }, [content])

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0])
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Untitled"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-none text-xl font-semibold focus-visible:ring-0 px-0 h-auto"
          />
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Clock className="mr-1 h-3 w-3" />
            {lastSaved ? `Last saved ${format(lastSaved, "MMM d, h:mm a")}` : "Not saved yet"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={moduleId || "none"} onValueChange={(value) => setModuleId(value === "none" ? null : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="No module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Others</SelectItem>
              {modules.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  {module.code} - {module.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isUploading}>
              <Save className="mr-1 h-4 w-4" /> Save
            </Button>
            {note && note.id !== "new" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your note.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "write" | "preview")}
        className="flex-1 flex flex-col"
      >
        <div className="flex items-center justify-between border-b px-4">
          <div className="markdown-toolbar flex flex-wrap gap-1 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("**", "bold text")}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("*", "italic text")}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("`", "code")}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("```", "code block")}
              title="Code Block"
            >
              <Code className="h-4 w-4 mr-1" />
              <Code className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("- ", "list item")}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("1. ", "list item")}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <label htmlFor="image-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Upload Image"
                disabled={isUploading}
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                {isUploading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
                disabled={isUploading}
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("[](url)", "link text")}
              title="Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
          <TabsList>
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="flex-1 p-0 overflow-hidden relative">
          {isUploading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p>Uploading image...</p>
              </div>
            </div>
          )}
          <div className="relative h-full">
            <Textarea
              id="markdown-content"
              ref={dropZoneRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note in Markdown... Drag and drop images here to upload"
              className="min-h-[calc(100vh-220px)] resize-none font-mono text-sm border-none rounded-none focus-visible:ring-0 p-4 transition-colors"
            />
            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md">
              <Upload className="h-3 w-3 inline mr-1" />
              Drag & drop images here
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 p-0 overflow-auto">
          <div className="p-4 min-h-[calc(100vh-220px)] prose prose-invert max-w-none">
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">Preview will appear here...</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
