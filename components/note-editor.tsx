"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  ArrowLeft,
  Save,
  Trash,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  LinkIcon,
  ImageIcon,
  Code,
  Eye,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from "react-markdown"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import type { Module } from "@/types/calendar"

interface Note {
  id: string
  title: string
  content: string
  moduleId?: string | null
  updated_at?: string
}

interface NoteEditorProps {
  note: Note | null
  modules: Module[]
  onSave: (id: string, note: { title: string; content: string; moduleId: string | null }) => void
  onDelete: (id: string) => void
  onCancel: () => void
}

export function NoteEditor({ note, modules, onSave, onDelete, onCancel }: NoteEditorProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState(note?.title || "Untitled Note")
  const [content, setContent] = useState(note?.content || "")
  const [moduleId, setModuleId] = useState<string | null>(note?.moduleId || null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialRenderRef = useRef(true)
  const lastSavedTitleRef = useRef(note?.title || "")
  const lastSavedContentRef = useRef(note?.content || "")
  const lastSavedModuleIdRef = useRef(note?.moduleId || null)

  // Update local state when the note prop changes (only if it's a different note)
  useEffect(() => {
    // Skip the initial render to avoid an unnecessary update
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      return
    }

    // Only update if the note has changed
    if (note) {
      setTitle(note.title || "Untitled Note")
      setContent(note.content || "")
      setModuleId(note.moduleId || null)

      // Update the refs to track the latest saved values
      lastSavedTitleRef.current = note.title || ""
      lastSavedContentRef.current = note.content || ""
      lastSavedModuleIdRef.current = note.moduleId || null

      // Reset unsaved changes flag
      setHasUnsavedChanges(false)
    } else {
      // If note is null (new note), reset to defaults
      setTitle("Untitled Note")
      setContent("")
      setModuleId(null)
      lastSavedTitleRef.current = ""
      lastSavedContentRef.current = ""
      lastSavedModuleIdRef.current = null
      setHasUnsavedChanges(false)
    }
  }, [note])

  // Check for unsaved changes
  useEffect(() => {
    if (
      title !== lastSavedTitleRef.current ||
      content !== lastSavedContentRef.current ||
      moduleId !== lastSavedModuleIdRef.current
    ) {
      setHasUnsavedChanges(true)
    } else {
      setHasUnsavedChanges(false)
    }
  }, [title, content, moduleId])

  // Handle manual save
  const handleSave = useCallback(() => {
    if (!note) return

    if (hasUnsavedChanges) {
      setIsSaving(true)

      try {
        onSave(note.id, {
          title: title || "Untitled Note",
          content,
          moduleId,
        })

        // Update the refs to track the latest saved values
        lastSavedTitleRef.current = title
        lastSavedContentRef.current = content
        lastSavedModuleIdRef.current = moduleId

        setHasUnsavedChanges(false)

        toast({
          title: "Note saved",
          description: "Your changes have been saved successfully.",
        })
      } catch (error) {
        toast({
          title: "Error saving note",
          description: "There was a problem saving your changes.",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    }
  }, [note, title, content, moduleId, hasUnsavedChanges, onSave, toast])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save on Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave])

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
  }

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
  }

  // Handle module change
  const handleModuleChange = (value: string) => {
    const newModuleId = value === "none" ? null : value
    setModuleId(newModuleId)
  }

  // Prompt before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Handle cancel with unsaved changes
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        onCancel()
      }
    } else {
      onCancel()
    }
  }

  // Insert markdown formatting at cursor position
  const insertFormatting = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end)

    setContent(newContent)

    // Focus back on textarea and set cursor position after formatting
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  // Insert AI generated content

  // Markdown formatting handlers
  const handleBold = () => insertFormatting("**", "**")
  const handleItalic = () => insertFormatting("*", "*")
  const handleH1 = () => insertFormatting("# ")
  const handleH2 = () => insertFormatting("## ")
  const handleH3 = () => insertFormatting("### ")
  const handleUnorderedList = () => insertFormatting("- ")
  const handleOrderedList = () => insertFormatting("1. ")
  const handleLink = () => insertFormatting("[", "](url)")
  const handleImage = () => insertFormatting("![alt text](", ")")
  const handleCode = () => insertFormatting("```\n", "\n```")

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleCancel} className="md:flex">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={title}
            onChange={handleTitleChange}
            className="h-auto border-0 p-0 text-lg font-medium focus-visible:ring-0 w-[150px] sm:w-auto"
            placeholder="Untitled Note"
          />
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && <span className="text-sm text-yellow-500 hidden sm:inline">Unsaved changes</span>}
          <KeyboardShortcuts />

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-1"
          >
            {isSaving ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </Button>
          {note && note.id !== "new" && (
            <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="border-b p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Select value={moduleId || "none"} onValueChange={handleModuleChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Module</SelectItem>
              {modules.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  {module.code} - {module.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "edit" | "preview" | "split")}>
              <TabsList>
                <TabsTrigger value="edit" className="flex items-center gap-1">
                  <Edit className="h-3 w-3" />
                  <span className="hidden sm:inline">Edit</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span className="hidden sm:inline">Preview</span>
                </TabsTrigger>
                <TabsTrigger value="split" className="flex items-center gap-1">
                  <div className="flex h-3 w-3 items-center justify-center">
                    <div className="h-3 w-1.5 border-l border-r"></div>
                  </div>
                  <span className="hidden sm:inline">Split</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="border-b p-2 flex flex-wrap gap-1">
        <Button variant="ghost" size="icon" onClick={handleBold} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleItalic} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleH1} title="Heading 1">
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleH2} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleH3} title="Heading 3">
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleUnorderedList} title="Bullet List">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleOrderedList} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLink} title="Link">
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleImage} title="Image">
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCode} title="Code Block">
          <Code className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {viewMode === "edit" && (
          <div className="h-full p-4">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              className="min-h-[calc(100vh-16rem)] w-full resize-none border-0 p-0 focus-visible:ring-0 font-mono"
              placeholder="Start writing..."
            />
          </div>
        )}

        {viewMode === "preview" && (
          <div className="h-full p-4 overflow-auto">
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{content || "Nothing to preview"}</ReactMarkdown>
            </div>
          </div>
        )}

        {viewMode === "split" && (
          <div className="grid h-full grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
            <div className="p-4 overflow-auto">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                className="min-h-[calc(100vh-16rem)] w-full resize-none border-0 p-0 focus-visible:ring-0 font-mono"
                placeholder="Start writing..."
              />
            </div>
            <div className="p-4 overflow-auto">
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{content || "Nothing to preview"}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>

      {note && note.id === "new" && (
        <div className="border-t p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1">
            {isSaving ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                <span>Save Note</span>
              </>
            )}
          </Button>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (note) {
                  onDelete(note.id)
                }
                setIsDeleteDialogOpen(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
