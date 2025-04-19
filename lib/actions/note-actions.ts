"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createNote(formData: FormData) {
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const moduleId = formData.get("moduleId") as string | null

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { error } = await supabase.from("notes").insert({
    title,
    content,
    module_id: moduleId || null,
    user_id: user.id,
  })

  if (error) {
    console.error("Error creating note:", error)
    throw new Error("Failed to create note")
  }

  revalidatePath("/notes")
  redirect("/notes")
}

export async function updateNote(noteId: string, formData: FormData) {
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const moduleId = formData.get("moduleId") as string | null

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { error } = await supabase
    .from("notes")
    .update({
      title,
      content,
      module_id: moduleId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error updating note:", error)
    throw new Error("Failed to update note")
  }

  revalidatePath("/notes")
  revalidatePath(`/notes/${noteId}`)
}

export async function deleteNote(noteId: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { error } = await supabase.from("notes").delete().eq("id", noteId).eq("user_id", user.id)

  if (error) {
    console.error("Error deleting note:", error)
    throw new Error("Failed to delete note")
  }

  revalidatePath("/notes")
  redirect("/notes")
}
