"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function searchNotes(userId: string, query: string): Promise<string> {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // Fetch all notes for the user
    const { data: notes, error } = await supabase
      .from("notes")
      .select("title, content, modules(name, code)")
      .eq("user_id", userId)

    if (error) throw error

    // Format notes for the AI prompt
    let formattedNotes = ""
    if (notes && notes.length > 0) {
      formattedNotes = notes
        .map((note) => {
          const moduleInfo = note.modules ? `[${note.modules.code}] ${note.modules.name}` : "No Module"
          return `--- Note: ${note.title} (${moduleInfo}) ---\n${note.content}\n\n`
        })
        .join("")
    }

    // Create the prompt for the AI
    const prompt = `
      You are Einstein, a helpful AI assistant for students. You're knowledgeable, friendly, and provide concise answers.
      ${formattedNotes ? `\nThe student has the following notes that you can reference:\n\n${formattedNotes}\n` : ""}
      
      The student is asking: "${query}"
      
      Provide a helpful response in markdown format. If the student's notes contain relevant information, reference it.
      If not, provide a helpful response based on your knowledge. Keep your responses concise but informative.
    `

    // Use fetch directly to call the Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are Einstein, a helpful AI assistant for students. You provide concise, informative answers in markdown format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("Error in searchNotes:", error)
    throw new Error("Failed to get a response")
  }
}
