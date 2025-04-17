"use client"

import { useState, useEffect, useCallback } from "react"
import { format, isAfter } from "date-fns"
import { ChevronDown, Edit, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Event, Module } from "@/types/calendar"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRealtimeSubscription } from "@/lib/supabase/realtime"

interface ModuleOverviewProps {
  modules: Module[]
  events: Event[]
  onEventClick: (event: Event) => void
  userId: string
}

export function ModuleOverview({ modules, events, onEventClick, userId }: ModuleOverviewProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newModuleName, setNewModuleName] = useState("")
  const [newModuleCode, setNewModuleCode] = useState("")
  const [editModuleId, setEditModuleId] = useState<string | null>(null)
  const [editModuleName, setEditModuleName] = useState("")
  const [editModuleCode, setEditModuleCode] = useState("")
  const [localModules, setLocalModules] = useState<Module[]>([])
  const supabase = createClient()

  // Initialize with modules from props
  useEffect(() => {
    setLocalModules(modules)
  }, [modules])

  // Fetch modules function for real-time updates
  const fetchModules = useCallback(async () => {
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true })

      if (modulesError) throw modulesError

      const formattedModules: Module[] = modulesData.map((module) => ({
        id: module.id,
        name: module.name,
        code: module.code,
        color: module.color || "#3b82f6",
      }))

      setLocalModules(formattedModules)
    } catch (error) {
      console.error("Error fetching modules:", error)
    }
  }, [supabase, userId])

  // Set up real-time subscription
  useRealtimeSubscription("modules", userId, fetchModules)

  const getModuleEvents = (moduleId: string) => {
    return events
      .filter((event) => event.moduleId === moduleId && !event.completed && isAfter(event.start, new Date()))
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }

  const handleAddModule = async () => {
    if (!newModuleName || !newModuleCode) return

    try {
      const { data, error } = await supabase
        .from("modules")
        .insert({
          user_id: userId,
          name: newModuleName,
          code: newModuleCode,
          color: "#3b82f6", // Default blue color
        })
        .select()

      if (error) throw error

      // Optimistic update
      if (data && data[0]) {
        const newModule: Module = {
          id: data[0].id,
          name: data[0].name,
          code: data[0].code,
          color: data[0].color || "#3b82f6",
        }
        setLocalModules([...localModules, newModule])
      }

      setNewModuleName("")
      setNewModuleCode("")
      setIsDialogOpen(false)

      toast({
        title: "Module added",
        description: "Your module has been added successfully.",
      })
    } catch (error) {
      console.error("Error adding module:", error)
      toast({
        title: "Error",
        description: "There was an error adding your module.",
        variant: "destructive",
      })
    }
  }

  const handleEditModule = async () => {
    if (!editModuleId || !editModuleName || !editModuleCode) return

    try {
      const { error } = await supabase
        .from("modules")
        .update({
          name: editModuleName,
          code: editModuleCode,
        })
        .eq("id", editModuleId)

      if (error) throw error

      // Optimistic update
      const updatedModules = localModules.map((module) =>
        module.id === editModuleId
          ? {
              ...module,
              name: editModuleName,
              code: editModuleCode,
            }
          : module,
      )
      setLocalModules(updatedModules)

      setIsEditDialogOpen(false)
      setEditModuleId(null)
      setEditModuleName("")
      setEditModuleCode("")

      toast({
        title: "Module updated",
        description: "Your module has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating module:", error)
      toast({
        title: "Error",
        description: "There was an error updating your module.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const { error } = await supabase.from("modules").delete().eq("id", moduleId)

      if (error) throw error

      // Optimistic update
      const updatedModules = localModules.filter((module) => module.id !== moduleId)
      setLocalModules(updatedModules)

      toast({
        title: "Module deleted",
        description: "Your module has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting module:", error)
      toast({
        title: "Error",
        description: "There was an error deleting your module.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (module: Module) => {
    setEditModuleId(module.id)
    setEditModuleName(module.name)
    setEditModuleCode(module.code)
    setIsEditDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Modules</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="font-aptos">
          {localModules.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-4 text-center">
              <h3 className="font-medium">No modules yet</h3>
              <p className="text-sm text-muted-foreground">Add a module to organize your school tasks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {localModules.map((module) => {
                const moduleEvents = getModuleEvents(module.id)

                return (
                  <Collapsible key={module.id} className="rounded-md border">
                    <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50">
                      <div>
                        <div className="font-medium">{module.name}</div>
                        <div className="text-xs text-muted-foreground">{module.code}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {moduleEvents.length} tasks
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit module</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(module)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteModule(module.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t p-3">
                        {moduleEvents.length === 0 ? (
                          <div className="py-2 text-center text-sm text-muted-foreground">No upcoming tasks</div>
                        ) : (
                          <div className="space-y-2">
                            {moduleEvents.map((event) => (
                              <div
                                key={event.id}
                                className="cursor-pointer rounded-md p-2 hover:bg-muted/50"
                                onClick={() => onEventClick(event)}
                              >
                                <div className="font-medium">{event.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(event.start, "MMM d, h:mm a")}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Module Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Module</DialogTitle>
            <DialogDescription>Add a new module to organize your school tasks</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moduleName">Module Name</Label>
              <Input
                id="moduleName"
                placeholder="e.g. Introduction to Computer Science"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moduleCode">Module Code</Label>
              <Input
                id="moduleCode"
                placeholder="e.g. CS101"
                value={newModuleCode}
                onChange={(e) => setNewModuleCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddModule}>Add Module</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription>Update your module details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editModuleName">Module Name</Label>
              <Input
                id="editModuleName"
                placeholder="e.g. Introduction to Computer Science"
                value={editModuleName}
                onChange={(e) => setEditModuleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editModuleCode">Module Code</Label>
              <Input
                id="editModuleCode"
                placeholder="e.g. CS101"
                value={editModuleCode}
                onChange={(e) => setEditModuleCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditModule}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
