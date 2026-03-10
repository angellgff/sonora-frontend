"use client";

import {
  saveConversation,
  getConversations,
  getConversationsWithLastMessage,
  updateConversation,
  getLastConversationWithUser,
} from "@/app/actions/conversations/conversations";
import { useTransition, useState, useCallback, useEffect } from "react";
import { Conversation } from "@/app/actions/conversations/types";
import { generateTitle } from "@/app/_helpers/generateTitle";
import { createBrowserClient } from "@supabase/ssr";

export function useConversation(agentId?: string | null) {
  const [isPending, startTransition] = useTransition();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Cliente Supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_TUGUIA_URL!,
    process.env.NEXT_PUBLIC_TUGUIA_ANON_KEY!
  );

  // Obtener usuario al montar
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const loadConversations = useCallback(() => {
    if (!userId) return;

    setError(null);
    startTransition(async () => {
      try {
        const data = await getConversationsWithLastMessage(userId);
        const filteredData = data.filter((c: any) => {
           const cAgentId = c.metadata?.agent_id;
           if (agentId) return cAgentId === agentId;
           return !cAgentId;
        });

        console.log("🔍 Conversaciones cargadas:", filteredData.map((c: Conversation) => ({
          id: c.id,
          title: c.title,
          last_msg: c.last_message_text,
          time: c.last_message_created_at
        })));
        setConversations(filteredData || []);
      } catch (error) {
        console.error("Error getting conversations:", error);
        setError("Error al cargar conversaciones");
        setConversations([]);
      }
    });
  }, [userId, agentId]);

  const saveNewConversation = useCallback(async (title?: string) => {
    if (!userId) return null;
    setError(null);
    setSuccess(null);

    try {
      const conversationId = await saveConversation({
        title:
          title ||
          `Conversación del ${new Date().toLocaleDateString("es-MX")}`,
        metadata: agentId ? { agent_id: agentId } : {},
      }, userId);

      const successMessage = conversationId
        ? `✅ Conversación guardada (ID: ${conversationId})`
        : "✅ Conversación guardada";

      startTransition(async () => {
        setSuccess(successMessage);
        const data = await getConversationsWithLastMessage(userId);
        const filteredData = data.filter((c: any) => {
           const cAgentId = c.metadata?.agent_id;
           if (agentId) return cAgentId === agentId;
           return !cAgentId;
        });
        setConversations(filteredData || []);
      });

      setTimeout(() => setSuccess(null), 3000);

      return conversationId;
    } catch (error) {
      console.error("Error saving conversation:", error);
      setError("Error al guardar la conversación");
      return null;
    }
  }, [userId, agentId]);

  // Obtener y actualizar la última conversación del usuario
  const updateLastConversationTitle = useCallback((firstMessage: string) => {
    if (!userId) return;
    console.log("🎯 updateLastConversationTitle llamado con:", firstMessage);
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        console.log("🔍 Buscando última conversación...");
        // Busca la última conversación
        const data = await getLastConversationWithUser(userId, agentId);
        console.log("📋 Conversación encontrada:", data);

        if (data) {
          console.log("🤖 Generando título con IA...");
          // Genera un nuevo titulo para la conversacion
          const generatedTitle = await generateTitle(firstMessage);
          console.log("✨ Título generado:", generatedTitle);

          // Actualiza directamente sin llamar a otra función con startTransition
          console.log("💾 Actualizando conversación en BD...");
          await updateConversation({
            id: data.id,
            title: generatedTitle,
          });

          setSuccess("✅ Conversación actualizada exitosamente");

          // Recarga la lista
          console.log("🔄 Recargando lista de conversaciones...");
          const updatedData = await getConversationsWithLastMessage(userId);
          const filteredData = updatedData.filter((c: any) => {
             const cAgentId = c.metadata?.agent_id;
             if (agentId) return cAgentId === agentId;
             return !cAgentId;
          });
          setConversations(filteredData || []);

          setTimeout(() => setSuccess(null), 3000);
          return data.id;
        } else {
          console.error("❌ No se encontró ninguna conversación");
          setError("No se encontró ninguna conversación");
          return null;
        }
      } catch (error) {
        console.error("❌ Error updating last conversation:", error);
        setError("Error al actualizar la última conversación");
        return null;
      }
    });
  }, [userId, agentId]);

  // Limpiar mensajes de estado
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    // Estados
    conversations,
    isPending,
    error,
    success,

    // Acciones
    saveConversation: saveNewConversation,
    loadConversations,
    updateLastConversationTitle,
    clearMessages,
  };
}