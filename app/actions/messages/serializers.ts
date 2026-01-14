// Reading types.ts first is safer.
import { Message, UIMessage, MessageRole } from "./types";

/**
 * 🔄 Serializer: Convierte mensajes de BD al formato del componente UI
 */
export function serializeMessageToUI(message: Message): UIMessage {
  return {
    id: message.id || `msg-${Date.now()}-${Math.random()}`,
    role: message.role === MessageRole.USER ? "user" : "agent",
    content: message.text_content,
    timestamp: message.created_at
      ? new Date(message.created_at).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      })
      : new Date().toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    type: message.type === "audio" ? "audio" : "text",
    isFinal: true,
    images: message.images || [],
  };
}

/**
 * 🔄 Serializer para arrays: Convierte múltiples mensajes
 */
export function serializeMessagesToUI(messages: Message[]): UIMessage[] {
  return messages.map(serializeMessageToUI);
}

