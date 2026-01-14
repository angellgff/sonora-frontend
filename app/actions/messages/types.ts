export enum MessageType {
  TEXT = "text",
  AUDIO = "audio",
  AUDIO_WITH_IMAGES = "audio_with_images",
  TEXT_WITH_IMAGES = "text_with_images",
}

export enum MessageRole {
  USER = "user",
  AGENT = "assistant",
  SYSTEM = "system",
}

export interface Message {
  id?: string;
  conversation_id: string;
  user_id: string;
  text_content: string;
  type?: MessageType;
  role: MessageRole;
  audio_file_path?: string | null;
  audio_duration_seconds?: number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  images?: string[]; // URLs de imagenes adjuntas
}

export interface PaginatedMessages {
  messages: Message[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
}

// Tipo para el formato del componente UI
export interface UIMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
  type: "text" | "audio";
  isFinal?: boolean;
  images?: string[]; // URLs para mostrar en UI
}
