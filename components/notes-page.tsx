"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { parseISO } from "date-fns"
import { Folder, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { MainLayout } from "@/components/main-layout"
import { NoteEditor } from "@/components/note-editor"
import { LoadingScreen } from "@/components/loading-screen"
import type { Module } from "@/types/calendar"

interface Note {
  id: string
  title: string
  content: string
  moduleId: string | null
  createdAt: Date
  updatedAt: Date
}

interface NotesPageProps {
  user: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
    }
  }
}

export function NotesPage({ user }: NotesPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const moduleId = searchParams.get("moduleId")
  const noteId = searchParams.get("noteId")
  const { toast } = useToast()

  const [modules, setModules] = useState<Module[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isCreatingModule, setIsCreatingModule] = useState(false)
  const [newModuleName, setNewModuleName] = useState("")
  const [newModuleCode, setNewModuleCode] = useState("")
  const [newModuleColor, setNewModuleColor] = useState("#3b82f6")
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const supabase = createClient()

  // Fetch notes function - extracted to be reused in real-time subscription
  const fetchNotes = useCallback(async () => {
    try {
      setFetchError(null)

      // Check if Supabase client is initialized
      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }

      const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (notesError) throw notesError

      const formattedNotes: Note[] = notesData.map((note) => ({
        id: note.id,
        title: note.title || "Untitled", // Provide default title if null
        content: note.content || "",
        moduleId: note.module_id,
        createdAt: parseISO(note.created_at),
        updatedAt: parseISO(note.updated_at),
      }))

      setNotes(formattedNotes)
      setFilteredNotes(formattedNotes)

      return formattedNotes
    } catch (error) {
      console.error("Error fetching notes:", error)
      setFetchError(error instanceof Error ? error.message : "Failed to fetch notes")
      toast({
        title: "Error",
        description: "Failed to load notes. Please try refreshing the page.",
        variant: "destructive",
      })
      return []
    }
  }, [user.id, supabase, toast])

  // Fetch modules function - extracted to be reused in real-time subscription
  const fetchModules = useCallback(async () => {
    try {
      // Check if Supabase client is initialized
      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }

      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true })

      if (modulesError) throw modulesError

      const formattedModules: Module[] = modulesData.map((module) => ({
        id: module.id,
        name: module.name,
        code: module.code,
        color: module.color || "#9333ea",
      }))

      setModules(formattedModules)
      return formattedModules
    } catch (error) {
      console.error("Error fetching modules:", error)
      toast({
        title: "Error",
        description: "Failed to load modules. Please try refreshing the page.",
        variant: "destructive",
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }, [user.id, supabase, toast])

  useEffect(() => {
    // Initial data fetch
    const initialFetch = async () => {
      setIsPageLoading(true)
      try {
        const notesData = await fetchNotes()
        await fetchModules()

        // If a note ID is specified in the URL, select that note
        if (noteId) {
          const note = notesData.find((n) => n.id === noteId)
          if (note) {
            setSelectedNote(note)
          }
        } else if (notesData.length > 0 && !selectedNote) {
          // Otherwise, select the first note if none is selected
          setSelectedNote(notesData[0])
        }
      } catch (error) {
        console.error("Error during initial fetch:", error)
      } finally {
        setIsPageLoading(false)
      }
    }

    initialFetch()

    // Set up real-time subscriptions
    const notesSubscription = supabase
      .channel("notes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${user.id}` }, () => {
        fetchNotes()
      })
      .subscribe()

    const modulesSubscription = supabase
      .channel("modules-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "modules", filter: `user_id=eq.${user.id}` },
        () => {
          fetchModules()
        },
      )
      .subscribe()

    return () => {
      notesSubscription.unsubscribe()
      modulesSubscription.unsubscribe()
    }
  }, [user.id, fetchNotes, fetchModules, noteId])

  // Filter notes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = notes.filter(
      (note) => note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query),
    )
    setFilteredNotes(filtered)
  }, [notes, searchQuery])

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId)
    setSelectedNote(null)
    router.push(`/notes?moduleId=${moduleId}`)
  }

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note)
    router.push(`/notes?moduleId=${note.moduleId || ""}&noteId=${note.id}`)
  }

  const handleCreateModule = async () => {
    if (!newModuleName.trim() || !newModuleCode.trim()) return

    try {
      const { data, error } = await supabase
        .from("modules")
        .insert({
          name: newModuleName.trim(),
          code: newModuleCode.trim(),
          color: newModuleColor,
          user_id: user.id,
        })
        .select()

      if (error) throw error

      setNewModuleName("")
      setNewModuleCode("")
      setNewModuleColor("#3b82f6")
      setIsCreatingModule(false)

      // Select the newly created module
      if (data && data.length > 0) {
        handleModuleSelect(data[0].id)
      }

      toast({
        title: "Module created",
        description: "Your module has been created successfully.",
      })
    } catch (error) {
      console.error("Error creating module:", error)
      toast({
        title: "Error",
        description: "There was an error creating your module.",
        variant: "destructive",
      })
    }
  }

  const handleCreateNote = async (id: string, note: { title: string; content: string; moduleId: string | null }) => {
    try {
      // Ensure title is not empty after trimming
      const trimmedTitle = note.title?.trim() || "Untitled Note"

      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: trimmedTitle,
          content: note.content || "",
          module_id: note.moduleId,
        })
        .select()

      if (error) throw error

      toast({
        title: "Note created",
        description: "Your note has been created successfully.",
      })

      // Update the note with the actual ID from the server
      if (data && data[0]) {
        const actualNote: Note = {
          id: data[0].id,
          title: data[0].title || "Untitled Note",
          content: data[0].content || "",
          moduleId: data[0].module_id,
          createdAt: parseISO(data[0].created_at),
          updatedAt: parseISO(data[0].updated_at),
        }

        setSelectedNote(actualNote)
        await fetchNotes() // Refresh notes list

        // Update URL to include the new note ID
        router.push(`/notes?moduleId=${actualNote.moduleId || ""}&noteId=${actualNote.id}`)
      }
    } catch (error) {
      console.error("Error creating note:", error)
      toast({
        title: "Error",
        description: "There was an error creating your note.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateNote = async (id: string, note: { title: string; content: string; moduleId: string | null }) => {
    try {
      // Ensure title is not empty after trimming
      const trimmedTitle = note.title?.trim() || "Untitled Note"

      const { error } = await supabase
        .from("notes")
        .update({
          title: trimmedTitle,
          content: note.content || "",
          module_id: note.moduleId,
        })
        .eq("id", id)

      if (error) throw error

      // Refresh notes to get the updated data
      await fetchNotes()
    } catch (error) {
      console.error("Error updating note:", error)
      toast({
        title: "Error",
        description: "There was an error updating your note.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId)

      if (error) throw error

      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
      })

      setSelectedNote(null)
      await fetchNotes() // Refresh notes list
      router.push(`/notes${moduleId ? `?moduleId=${moduleId}` : ""}`)
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Error",
        description: "There was an error deleting your note.",
        variant: "destructive",
      })
    }
  }

  const handleNewNote = () => {
    // Create a new empty note with default values
    const newNote: Note = {
      id: "new",
      title: "",
      content: "",
      moduleId: moduleId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSelectedNote(newNote)
  }

  const [selectedModule, setSelectedModule] = useState<string | null>(moduleId)

  // Retry fetch if there was an error
  useEffect(() => {
    if (fetchError) {
      const timer = setTimeout(() => {
        fetchNotes()
      }, 5000) // Retry after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [fetchError, fetchNotes])

  return (
    <MainLayout user={{ id: user.id, email: user.email, full_name: user.user_metadata?.full_name }}>
      <LoadingScreen isLoading={isPageLoading} />

      <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
        {/* Sidebar - Make it conditionally visible on mobile */}
        <div className={`w-full border-r md:w-64 ${selectedNote && "hidden md:block"}`}>
          <div className="flex h-14 items-center justify-between border-b px-4">
            <h2 className="font-medium">Modules</h2>
            <div className="flex items-center gap-2">
              {selectedNote && (
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedNote(null)}>
                  Back
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsCreatingModule(!isCreatingModule)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 border-b">
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {isCreatingModule && (
            <div className="border-b p-4">
              <div className="space-y-2">
                <Input
                  placeholder="Module Name"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                />
                <Input
                  placeholder="Module Code"
                  value={newModuleCode}
                  onChange={(e) => setNewModuleCode(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newModuleColor}
                    onChange={(e) => setNewModuleColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-md border-0"
                  />
                  <Button onClick={handleCreateModule} className="flex-1">
                    Create Module
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-auto">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : modules.length > 0 ? (
              modules.map((module) => (
                <div key={module.id}>
                  <button
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-accent ${
                      selectedModule === module.id ? "bg-accent" : ""
                    }`}
                    onClick={() => handleModuleSelect(module.id)}
                  >
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: module.color || "#3b82f6" }} />
                    <span className="font-medium">{module.name}</span>
                    <span className="text-xs text-muted-foreground">({module.code})</span>
                  </button>

                  {selectedModule === module.id && (
                    <div className="ml-6 space-y-1 py-2">
                      {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="mx-4 h-6 w-[calc(100%-2rem)]" />
                        ))
                      ) : filteredNotes.filter((note) => note.moduleId === module.id).length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">No notes</div>
                      ) : (
                        filteredNotes
                          .filter((note) => note.moduleId === module.id)
                          .map((note) => (
                            <button
                              key={note.id}
                              className={`flex w-full items-center gap-2 rounded-sm px-4 py-1 text-left text-sm hover:bg-accent/50 ${
                                selectedNote?.id === note.id ? "bg-accent/50 font-medium" : ""
                              }`}
                              onClick={() => handleNoteSelect(note)}
                            >
                              {note.title || "Untitled Note"}
                            </button>
                          ))
                      )}

                      <button
                        className="flex w-full items-center gap-2 px-4 py-1 text-left text-sm text-muted-foreground hover:text-foreground"
                        onClick={handleNewNote}
                      >
                        <Plus className="h-3 w-3" />
                        New Note
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Folder className="mb-2 h-8 w-8 text-muted-foreground" />
                <h3 className="font-medium">No modules</h3>
                <p className="text-sm text-muted-foreground">Create a module to get started</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsCreatingModule(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Module
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Note editor - Make it conditionally visible on mobile */}
        <div className={`flex-1 overflow-hidden ${!selectedNote && "hidden md:block"}`}>
          {fetchError && !isLoading ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </div>
              <h3 className="mt-4 font-medium">Error loading notes</h3>
              <p className="mt-2 text-sm text-muted-foreground">{fetchError}</p>
              <Button variant="outline" className="mt-4" onClick={() => fetchNotes()}>
                Retry
              </Button>
            </div>
          ) : selectedNote ? (
            <NoteEditor
              note={selectedNote}
              modules={modules}
              onSave={selectedNote.id === "new" ? handleCreateNote : handleUpdateNote}
              onDelete={handleDeleteNote}
              onCancel={() => setSelectedNote(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <Folder className="mb-2 h-8 w-8 text-muted-foreground" />
              <h3 className="font-medium">No note selected</h3>
              <p className="text-sm text-muted-foreground">
                {selectedModule ? "Select a note or create a new one" : "Select a module to view or create notes"}
              </p>
              {selectedModule && (
                <Button variant="outline" className="mt-4" onClick={handleNewNote}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Note
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
