"use client"

import { useState, useEffect } from "react"
import { parseISO } from "date-fns"
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { MainLayout } from "@/components/main-layout"
import { NoteEditor } from "@/components/note-editor"
import type { Module } from "@/types/calendar"
import type { Note } from "@/types/calendar"

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
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  // Initialize with "All Notes" expanded
  useEffect(() => {
    setExpandedModules({ all: true, others: true })
  }, [])

  useEffect(() => {
    // Fetch notes
    const fetchNotes = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching notes:", error)
        toast({
          title: "Error",
          description: "Failed to load notes",
          variant: "destructive",
        })
      }
    }

    // Fetch modules
    const fetchModules = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching modules:", error)
        toast({
          title: "Error",
          description: "Failed to load modules",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotes()
    fetchModules()

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
  }, [user.id, supabase, toast])

  const handleCreateNote = async (note: { title: string; content: string; moduleId: string | null }) => {
    try {
      // Ensure title is not undefined and not empty after trimming
      const trimmedTitle = note.title?.trim() || ""

      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        title: trimmedTitle,
        content: note.content || "",
        module_id: note.moduleId,
      })

      if (error) throw error

      toast({
        title: "Note created",
        description: "Your note has been created successfully.",
      })

      setSelectedNote(null)
    } catch (error) {
      console.error("Error creating note:", error)
      toast({
        title: "Error",
        description: "There was an error creating your note.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateNote = async (
    noteId: string,
    note: { title: string; content: string; moduleId: string | null },
  ) => {
    try {
      // Ensure title is not undefined and not empty after trimming
      const trimmedTitle = note.title?.trim() || ""
      if (!trimmedTitle) {
        toast({
          title: "Error",
          description: "Note title cannot be empty",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("notes")
        .update({
          title: trimmedTitle,
          content: note.content || "",
          module_id: note.moduleId,
        })
        .eq("id", noteId)

      if (error) throw error

      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      })
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
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Error",
        description: "There was an error deleting your note.",
        variant: "destructive",
      })
    }
  }

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note)
  }

  const handleNewNote = (moduleId: string | null = null) => {
    // Create a new empty note with default values
    const newNote: Note = {
      id: "new",
      title: "",
      content: "",
      moduleId: moduleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSelectedNote(newNote)
  }

  const toggleModuleExpanded = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  // Filter notes based on search query
  const filteredNotes = searchQuery
    ? notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : notes

  // Group notes by module
  const notesByModule: Record<string, Note[]> = {}

  // Initialize with an empty array for "none" (Others) module
  notesByModule["none"] = []

  // Group notes by their moduleId
  filteredNotes.forEach((note) => {
    const moduleId = note.moduleId || "none"
    if (!notesByModule[moduleId]) {
      notesByModule[moduleId] = []
    }
    notesByModule[moduleId].push(note)
  })

  // Count notes per module
  const noteCountByModule: Record<string, number> = {}
  modules.forEach((module) => {
    noteCountByModule[module.id] = notes.filter((note) => note.moduleId === module.id).length
  })
  // Count notes without module (Others)
  noteCountByModule["none"] = notes.filter((note) => !note.moduleId).length

  return (
    <MainLayout user={{ id: user.id, email: user.email, full_name: user.user_metadata?.full_name }}>
      <div className="flex h-screen">
        {/* Notion-like Sidebar */}
        <div className="flex h-full border-r w-72 flex-shrink-0 flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search notes..."
                className="w-full pl-9 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Tree View */}
          <div className="overflow-y-auto flex-1 p-1.5">
            {isLoading ? (
              <div className="flex h-20 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-1">
                {/* All Notes */}
                <div
                  className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm cursor-pointer ${
                    selectedNote === null ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    toggleModuleExpanded("all")
                    setSelectedNote(null)
                  }}
                >
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-1 mr-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleModuleExpanded("all")
                      }}
                    >
                      {expandedModules["all"] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <span className="flex items-center">
                      {expandedModules["all"] ? (
                        <FolderOpen className="h-4 w-4 mr-2" />
                      ) : (
                        <Folder className="h-4 w-4 mr-2" />
                      )}
                      All Notes
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground mr-2">{notes.length}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNewNote()
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Others module (for notes without a module) */}
                {expandedModules["all"] && (
                  <div
                    className={`ml-4 flex items-center justify-between rounded-md px-3 py-1.5 text-sm cursor-pointer ${
                      selectedNote === null ? "hover:bg-muted" : "hover:bg-muted"
                    }`}
                    onClick={() => toggleModuleExpanded("others")}
                  >
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-1 mr-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleModuleExpanded("others")
                        }}
                      >
                        {expandedModules["others"] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <span className="flex items-center">
                        {expandedModules["others"] ? (
                          <FolderOpen className="h-4 w-4 mr-2" />
                        ) : (
                          <Folder className="h-4 w-4 mr-2" />
                        )}
                        Others
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground mr-2">{noteCountByModule["none"]}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNewNote(null)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes without module (Others) */}
                {expandedModules["all"] && expandedModules["others"] && notesByModule["none"] && (
                  <div className="ml-8 space-y-1 mt-1">
                    {notesByModule["none"].map((note) => (
                      <div
                        key={note.id}
                        className={`flex items-center rounded-md px-3 py-1.5 text-sm cursor-pointer ${
                          selectedNote?.id === note.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        }`}
                        onClick={() => handleNoteClick(note)}
                      >
                        <File className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{note.title || "Untitled"}</span>
                      </div>
                    ))}
                    {notesByModule["none"] && notesByModule["none"].length === 0 && searchQuery && (
                      <div className="text-sm text-muted-foreground px-3 py-1.5">No results found</div>
                    )}
                  </div>
                )}

                {/* Modules Header */}
                <div className="flex items-center justify-between mt-4 px-3 py-1.5 text-sm text-muted-foreground">
                  <span>Modules</span>
                </div>

                {/* Modules */}
                {modules.map((module) => (
                  <div key={module.id}>
                    <div
                      className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm cursor-pointer ${
                        selectedNote === null ? "hover:bg-muted" : "hover:bg-muted"
                      }`}
                      onClick={() => toggleModuleExpanded(module.id)}
                    >
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-1 mr-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleModuleExpanded(module.id)
                          }}
                        >
                          {expandedModules[module.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <span className="flex items-center">
                          {expandedModules[module.id] ? (
                            <FolderOpen className="h-4 w-4 mr-2" />
                          ) : (
                            <Folder className="h-4 w-4 mr-2" />
                          )}
                          {module.code}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-2">{noteCountByModule[module.id]}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNewNote(module.id)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Module Notes */}
                    {expandedModules[module.id] && notesByModule[module.id] && (
                      <div className="ml-8 space-y-1 mt-1">
                        {notesByModule[module.id].map((note) => (
                          <div
                            key={note.id}
                            className={`flex items-center rounded-md px-3 py-1.5 text-sm cursor-pointer ${
                              selectedNote?.id === note.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                            }`}
                            onClick={() => handleNoteClick(note)}
                          >
                            <File className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{note.title || "Untitled"}</span>
                          </div>
                        ))}
                        {notesByModule[module.id] && notesByModule[module.id].length === 0 && searchQuery && (
                          <div className="text-sm text-muted-foreground px-3 py-1.5">No results found</div>
                        )}
                        {!notesByModule[module.id] && (
                          <div className="text-sm text-muted-foreground px-3 py-1.5">No notes</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {modules.length === 0 && <div className="text-sm text-muted-foreground px-3 py-1.5">No modules</div>}
              </div>
            )}
          </div>

          {/* Create Button */}
          <div className="p-3 border-t">
            <Button className="w-full justify-start" onClick={() => handleNewNote()}>
              <Plus className="mr-2 h-4 w-4" /> New Note
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {selectedNote ? (
            <NoteEditor
              note={selectedNote.id === "new" ? null : selectedNote}
              modules={modules}
              onSave={selectedNote.id === "new" ? handleCreateNote : handleUpdateNote}
              onDelete={handleDeleteNote}
              onCancel={() => setSelectedNote(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-4">
              <div className="max-w-md">
                <h2 className="text-2xl font-bold mb-2">Welcome to Notes</h2>
                <p className="text-muted-foreground mb-6">
                  Select a note from the sidebar or create a new one to get started.
                </p>
                <Button onClick={() => handleNewNote()}>
                  <Plus className="mr-2 h-4 w-4" /> Create New Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
