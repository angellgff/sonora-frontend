"use server";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function generateTitle(firstMessage: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      messages: [
        {
          role: "system",
          content:
            "Genera un título corto y descriptivo (máximo 50 caracteres) para una conversación que comienza con el siguiente mensaje. Solo responde con el título, sin comillas ni puntuación adicional.",
        },
        {
          role: "user",
          content: firstMessage,
        },
      ],
      temperature: 0.7,
    });

    return text.trim() || firstMessage.substring(0, 50);
  } catch (error) {
    console.error("Error generando título con IA:", error);
    return (
      firstMessage.substring(0, 50) + (firstMessage.length > 50 ? "..." : "")
    );
  }
}
