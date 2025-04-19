import { NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the message from the request
    const { message } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Check if GROQ API key is available
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Call the Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are einstein, a helpful AI assistant for students. Provide concise, accurate answers in markdown format. Include code examples when relevant. Be friendly and educational.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Groq API error:", errorData)
      return NextResponse.json({ error: "Failed to get response from AI service" }, { status: 500 })
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    // Return the AI response
    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error("Error in einstein API:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}
