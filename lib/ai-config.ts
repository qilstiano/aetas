export const aiConfig = {
  provider: "groq",
  model: "llama3-70b-8192",
}

export function handleAIError(error: unknown): string {
  console.error("AI Error:", error)

  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred with the AI service. Please try again later."
}
