"use client";

import { useState, useCallback, useRef } from "react";

// Tipo para los mensajes de voz
export interface VoiceMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
  type: "text" | "audio";
  isFinal: boolean; // Para distinguir mensajes parciales de finales
  images?: string[]; // URLs de imagenes
}

export function useVoiceMessages() {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentUserMessage, setCurrentUserMessage] = useState<string>("");
  const [currentBotMessage, setCurrentBotMessage] = useState<string>("");

  // Buffers para acumular todos los fragmentos
  const userMessageBuffer = useRef<string>("");
  const botMessageBuffer = useRef<string>("");

  // Flags para controlar cuándo finalizar mensajes (evitar duplicados)
  const userMessageFinalized = useRef<boolean>(false);
  const botIsCurrentlySpeaking = useRef<boolean>(false);

  // Agregar o actualizar mensaje del usuario (acumula fragmentos)
  const addUserMessage = useCallback((text: string, isFinal: boolean, images?: string[]) => {
    console.log(
      "📝 addUserMessage:",
      text,
      "final:",
      isFinal,
      "buffer:",
      userMessageBuffer.current
    );

    // Resetear flag cuando hay nuevo input del usuario
    userMessageFinalized.current = false;

    // Solo acumular transcripts finales
    if (isFinal && (text.trim() || (images && images.length > 0))) {
      userMessageBuffer.current = userMessageBuffer.current
        ? `${userMessageBuffer.current} ${text}`
        : text;

      if (images && images.length > 0) {
        const newMessage: VoiceMessage = {
          id: `user-${Date.now()}`,
          role: "user",
          content: text.trim() || userMessageBuffer.current.trim(), // Usar texto actual o buffer
          timestamp: new Date().toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "text", // Si tiene imagenes suele ser texto escrito
          isFinal: true,
          images: images
        };
        setMessages((prev) => [...prev, newMessage]);
        userMessageBuffer.current = ""; // Limpiar buffer
        setCurrentUserMessage("");
        return;
      }

      setCurrentUserMessage(userMessageBuffer.current);

    } else if (!isFinal && text.trim()) {
      // Mostrar transcripción parcial (sin agregar al buffer permanente)
      const partialText = userMessageBuffer.current
        ? `${userMessageBuffer.current} ${text}`
        : text;
      setCurrentUserMessage(partialText);
    }
  }, []);

  // Agregar mensaje completo del usuario (para chat de texto, sin buffer)
  const addUserMessageFinal = useCallback((text: string, images?: string[]) => {
    console.log("👤 addUserMessageFinal:", text, images);
    if (text.trim() || (images && images.length > 0)) {
      const newMessage: VoiceMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim() || "[Imagen]",
        timestamp: new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "text",
        isFinal: true,
        images: images,
      };
      setMessages((prev) => [...prev, newMessage]);
    }
  }, []);

  // Finalizar mensaje del usuario (cuando el bot empieza a responder)
  const finalizeUserMessage = useCallback(() => {
    console.log(
      "✅ Finalizando mensaje del usuario:",
      userMessageBuffer.current
    );
    if (userMessageBuffer.current.trim()) {
      const newMessage: VoiceMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userMessageBuffer.current.trim(),
        timestamp: new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "audio",
        isFinal: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      userMessageBuffer.current = "";
      setCurrentUserMessage("");
    }
  }, []);

  // Agregar o actualizar mensaje del bot (acumula fragmentos)
  const addBotMessage = useCallback((text: string) => {
    console.log("🤖 addBotMessage:", text, "buffer:", botMessageBuffer.current);
    // Acumular el texto en el buffer
    botMessageBuffer.current = botMessageBuffer.current + text;
    setCurrentBotMessage(botMessageBuffer.current);
  }, []);

  // Agregar mensaje completo del bot (para chat de texto, sin acumular)
  const addBotMessageFinal = useCallback((text: string) => {
    console.log("🤖 addBotMessageFinal:", text);
    if (text.trim()) {
      const newMessage: VoiceMessage = {
        id: `bot-${Date.now()}`,
        role: "agent",
        content: text.trim(),
        timestamp: new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "text",
        isFinal: true,
      };
      setMessages((prev) => [...prev, newMessage]);
    }
  }, []);

  // Finalizar mensaje del bot (cuando termina de hablar)
  const finalizeBotMessage = useCallback(() => {
    console.log("✅ Finalizando mensaje del bot:", botMessageBuffer.current);
    if (botMessageBuffer.current.trim()) {
      const newMessage: VoiceMessage = {
        id: `bot-${Date.now()}`,
        role: "agent",
        content: botMessageBuffer.current.trim(),
        timestamp: new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "audio",
        isFinal: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      botMessageBuffer.current = "";
      setCurrentBotMessage("");
    }
  }, []);

  // Cuando el bot empieza a hablar → finalizar mensaje del usuario (solo una vez)
  const startBotSpeaking = useCallback(() => {
    console.log(
      "🟢 BOT STARTED → finalizando mensaje del usuario (si no se ha hecho)"
    );

    // Solo finalizar el mensaje del usuario la PRIMERA vez que el bot habla
    if (!userMessageFinalized.current && userMessageBuffer.current.trim()) {
      finalizeUserMessage();
      userMessageFinalized.current = true;
    }

    // Marcar que el bot está hablando
    botIsCurrentlySpeaking.current = true;
  }, [finalizeUserMessage]);

  // Cuando el bot termina de hablar → finalizar mensaje del bot (solo si realmente estaba hablando)
  const stopBotSpeaking = useCallback(() => {
    console.log("🔴 BOT STOPPED → finalizando mensaje del bot");

    // Solo finalizar si el bot estaba hablando y tiene contenido
    if (botIsCurrentlySpeaking.current && botMessageBuffer.current.trim()) {
      finalizeBotMessage();
      botIsCurrentlySpeaking.current = false;
      userMessageFinalized.current = false; // Resetear para la próxima ronda
    }
  }, [finalizeBotMessage]);

  // Limpiar todos los mensajes
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentUserMessage("");
    setCurrentBotMessage("");
    userMessageBuffer.current = "";
    botMessageBuffer.current = "";
    userMessageFinalized.current = false;
    botIsCurrentlySpeaking.current = false;
  }, []);

  // Obtener todos los mensajes incluyendo parciales
  const getAllMessages = useCallback(() => {
    const allMessages = [...messages];

    // Agregar mensaje parcial del usuario si existe
    if (currentUserMessage.trim()) {
      allMessages.push({
        id: "user-temp",
        role: "user",
        content: currentUserMessage,
        timestamp: new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "audio",
        isFinal: false,
      });
    }

    // Agregar mensaje parcial del bot si existe
    if (currentBotMessage.trim()) {
      allMessages.push({
        id: "bot-temp",
        role: "agent",
        content: currentBotMessage,
        timestamp: new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "audio",
        isFinal: false,
      });
    }

    return allMessages;
  }, [messages, currentUserMessage, currentBotMessage]);

  return {
    messages: getAllMessages(),
    addUserMessage,
    addUserMessageFinal,
    addBotMessage,
    addBotMessageFinal,
    startBotSpeaking,
    stopBotSpeaking,
    clearMessages,
    currentUserMessage,
    currentBotMessage,
  };
}
