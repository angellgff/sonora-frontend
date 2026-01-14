"use client";

import { useCallback, useState, useTransition } from "react";
import {
  saveMessage,
  getConversationMessages,
} from "@/app/actions/messages/messages";
import { Message, PaginatedMessages } from "@/app/actions/messages/types";

export function useMessages() {
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextOffset, setNextOffset] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  /**
   * 📥 Cargar mensajes iniciales de una conversación
   */
  const loadMessages = useCallback(
    (conversationId: string, limit: number = 50) => {
      setError(null);
      setSuccess(null);

      startTransition(async () => {
        try {
          const result: PaginatedMessages = await getConversationMessages(
            conversationId,
            limit,
            0
          );

          setMessages(result.messages);
          setTotal(result.total);
          setHasMore(result.hasMore);
          setNextOffset(result.nextOffset);

          console.log(
            `✅ Mensajes cargados: ${result.messages.length}/${result.total}`
          );
        } catch (error) {
          console.error("Error loading messages:", error);
          setError("Error al cargar mensajes");
          setMessages([]);
        }
      });
    },
    []
  );

  /**
   * 📥 Cargar más mensajes (scroll infinito)
   */
  const loadMoreMessages = useCallback(
    (conversationId: string, limit: number = 50) => {
      if (!hasMore || isLoadingMore) {
        console.log("⏭️ No hay más mensajes o ya está cargando");
        return;
      }

      setError(null);
      setIsLoadingMore(true);

      startTransition(async () => {
        try {
          const result: PaginatedMessages = await getConversationMessages(
            conversationId,
            limit,
            nextOffset
          );

          // Agregar mensajes nuevos al final
          setMessages((prev) => [...prev, ...result.messages]);
          setTotal(result.total);
          setHasMore(result.hasMore);
          setNextOffset(result.nextOffset);

          console.log(
            `✅ Más mensajes cargados: ${result.messages.length} (total: ${messages.length + result.messages.length}/${result.total})`
          );
        } catch (error) {
          console.error("Error loading more messages:", error);
          setError("Error al cargar más mensajes");
        } finally {
          setIsLoadingMore(false);
        }
      });
    },
    [hasMore, isLoadingMore, nextOffset, messages.length]
  );

  /**
   * 💾 Guardar un nuevo mensaje
   */
  const saveNewMessage = useCallback(
    (message: Message, autoReload: boolean = false) => {
      setError(null);
      setSuccess(null);

      startTransition(async () => {
        try {
          await saveMessage(message);
          setSuccess("Mensaje guardado correctamente");

          // Opción 1: Auto-recargar mensajes después de guardar
          if (autoReload) {
            const result: PaginatedMessages = await getConversationMessages(
              message.conversation_id,
              50,
              0
            );
            setMessages(result.messages);
            setTotal(result.total);
            setHasMore(result.hasMore);
            setNextOffset(result.nextOffset);
          }
          // Opción 2: Agregar mensaje localmente (optimistic update)
          else {
            setMessages((prev) => [...prev, message]);
            setTotal((prev) => prev + 1);
          }

          console.log(
            "✅ Mensaje guardado:",
            message.text_content.substring(0, 50)
          );
        } catch (error) {
          console.error("Error saving message:", error);
          setError("Error al guardar mensaje");
          throw error;
        }
      });
    },
    []
  );

  /**
   * 🗑️ Limpiar mensajes del estado
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setTotal(0);
    setHasMore(false);
    setNextOffset(0);
    setError(null);
    setSuccess(null);
    console.log("🗑️ Mensajes limpiados");
  }, []);

  /**
   * ➕ Agregar mensaje local (sin guardar en BD)
   * Útil para optimistic updates o mensajes temporales
   */
  const addLocalMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
    setTotal((prev) => prev + 1);
  }, []);

  return {
    // Estados
    messages,
    total,
    hasMore,
    isPending,
    isLoadingMore,
    error,
    success,

    // Acciones
    loadMessages,
    loadMoreMessages,
    saveMessage: saveNewMessage,
    clearMessages,
    addLocalMessage,
  };
}
