"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { VideoPreview } from "./components/VideoPreview";
import { ChatControls } from "./components/ChatControls";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatArea } from "./components/ChatArea";
import { useTextChat } from "@/hooks/useTextChat";
import {
  Menu,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Bot,
  ArrowLeft,
} from "lucide-react";
import { usePipecatCloud as usePipecat } from "@/hooks/usePipecatCloud";
import { useVoiceMessages } from "@/hooks/useVoiceMessages";
import { useMessages } from "@/hooks/useMessages";
import type { TranscriptData, BotLLMTextData } from "@pipecat-ai/client-js";
import { useConversation } from "@/hooks/useConversation";
import type { Conversation } from "@/app/actions/conversations/types";
import { serializeMessagesToUI } from "@/app/actions/messages/serializers";
import { deleteConversation } from "@/app/actions/conversations/conversations";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { compressImageToBase64 } from "../_helpers/imageUtils";

export const dynamic = 'force-dynamic';

type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
  type: "text" | "audio";
  isFinal?: boolean;
};

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Abrir sidebar automáticamente en escritorio
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarOpen(true);
    }
  }, []);
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [titleGenerated, setTitleGenerated] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [textChatLoading, setTextChatLoading] = useState(false);
  const router = useRouter();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder";
  const supabase = createBrowserClient(supabaseUrl, supabaseKey);

  const {
    conversations: conversationsList,
    loadConversations,
    updateLastConversationTitle,
    saveConversation,
  } = useConversation();

  const {
    messages: dbMessages,
    loadMessages,
    clearMessages: clearDbMessages,
    isPending: isLoadingMessages,
  } = useMessages();

  // Hook para chat de texto (sin llamada activa)
  const {
    sendTextMessage: sendTextChatMessage,
    isLoading: isTextChatLoading,
    streamingContent,
    error: textChatError,
  } = useTextChat(
    // onMessageStart
    () => {
      setTextChatLoading(true);
    },
    // onMessageChunk - no necesitamos hacer nada aquí
    undefined,
    // onMessageEnd - agregar el mensaje del bot a la UI
    (fullMessage) => {
      setTextChatLoading(false);
      // Agregar respuesta del bot directamente (sin recargar de BD)
      if (fullMessage) {
        addBotMessageFinal(fullMessage);
      }
      // Solo actualizar lista de conversaciones en sidebar
      loadConversations();
    }
  );

  // Hook para gestionar mensajes de voz
  const {
    messages: voiceMessages,
    addUserMessage,
    addUserMessageFinal,
    addBotMessage,
    addBotMessageFinal,
    startBotSpeaking,
    stopBotSpeaking,
    clearMessages: clearVoiceMessages,
  } = useVoiceMessages();

  const convertedDbMessages: Message[] = useMemo(
    () => serializeMessagesToUI(dbMessages),
    [dbMessages]
  );

  const allMessages: Message[] = useMemo(() => {
    const baseMessages = [...convertedDbMessages, ...voiceMessages];

    // Si hay contenido en streaming del chat de texto, agregarlo como mensaje temporal
    if (streamingContent && textChatLoading) {
      baseMessages.push({
        id: "streaming-message",
        role: "agent",
        content: streamingContent,
        timestamp: new Date().toISOString(),
        type: "text",
        isFinal: false,
      });
    }

    return baseMessages;
  }, [convertedDbMessages, voiceMessages, streamingContent, textChatLoading]);

  // USE EFFECTS


  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log("Usuario autenticado:", user.id);
        setUserId(user.id);
      } else {
        console.log("No hay usuario autenticado, redirigiendo...");
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    // Si ya se generó el título para esta sesión, no hacer nada
    if (titleGenerated) return;

    // Si hay una conversación seleccionada, verificar si ya tiene un título personalizado
    // (es decir, que NO empiece con "Conversación del")
    if (selectedConversation?.id && !selectedConversation.title.startsWith("Conversación del")) {
      return;
    }

    // Filtrar solo mensajes del usuario que estén finalizados
    const userMessagesFinal = allMessages.filter(
      (msg) => msg.role === "user" && msg.isFinal !== false
    );

    console.log("🔍 Validación de título:", {
      allMessagesCount: allMessages.length,
      userMessagesFinalCount: userMessagesFinal.length,
      titleGenerated,
    });

    // Si hay exactamente 1 mensaje del usuario finalizado, generar el título
    if (userMessagesFinal.length === 1) {
      const firstUserMessage = userMessagesFinal[0];
      console.log(
        "✅ Primer mensaje del usuario detectado:",
        firstUserMessage.content
      );
      setTitleGenerated(true); // Marcar como generado para evitar ejecuciones múltiples
      updateLastConversationTitle(firstUserMessage.content);
    }
  }, [
    allMessages,
    selectedConversation,
    updateLastConversationTitle,
    titleGenerated,
  ]);

  // Callbacks para Pipecat
  const pipecatCallbacks = useMemo(
    () => ({
      onUserTranscript: (data: TranscriptData) => {
        console.log("🎤 USER TRANSCRIPT:", data.text, "final:", data.final);
        addUserMessage(data.text, data.final);
      },
      onBotTranscript: (data: BotLLMTextData) => {
        console.log("🤖 BOT TRANSCRIPT:", data.text);
        addBotMessage(data.text);
      },
      onBotStartedSpeaking: () => {
        console.log(
          "🟢 BOT STARTED SPEAKING → Finalizando mensaje del usuario"
        );
        startBotSpeaking();
      },
      onBotStoppedSpeaking: () => {
        console.log("🔴 BOT STOPPED SPEAKING → Finalizando mensaje del bot");
        stopBotSpeaking();
        // Recargar conversaciones para actualizar el "último mensaje" en el sidebar
        // Le damos un pequeño delay para asegurar que el backend haya guardado el mensaje
        setTimeout(() => {
          loadConversations();
        }, 1000);
      },
    }),
    [addUserMessage, addBotMessage, startBotSpeaking, stopBotSpeaking]
  );

  const {
    isConnected,
    isInitialized,
    isBotSpeaking,
    error,
    connect,
    disconnect,
    sendTextMessage,
    localVideoStream,
    isCameraOn,
    toggleCamera,
    sendImageMessage,
    sendMultimodalMessage,
    sendFileMessage,
  } = usePipecat(pipecatCallbacks);

  // Safety valve: Ensure isConnecting is disabled when connected
  useEffect(() => {
    if (isConnected) {
      setIsConnecting(false);
    }
  }, [isConnected]);

  const handleCallToggle = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      setIsConnecting(true);
      try {
        let targetConversationId = selectedConversation?.id;

        if (!targetConversationId) {
          console.log("Creando conversacion antes de conectar...");
          const newId = await saveConversation();
          if (newId) {
            targetConversationId = newId;
            console.log("Conversacion creada con ID:", newId);

            // ACTUALIZACIÓN CLAVE: Establecer la conversación seleccionada inmediatamente
            // para que si el usuario cuelga y vuelve a llamar, use ESTE mismo ID.
            setSelectedConversation({
              id: newId,
              title: `Conversación del ${new Date().toLocaleDateString("es-MX")}`,
            });
          }
        }

        setTitleGenerated(false);

        console.log("Iniciando llamada en:", targetConversationId);

        await connect(targetConversationId, userId || undefined);

        setTimeout(() => {
          loadConversations();
        }, 1000);
      } catch (error) {
        console.error("Error al conectar:", error);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const getCallButtonText = () => {
    if (isConnecting) return "Conectando...";
    if (isInitialized === false) return "Inicializando...";
    if (isConnected) return "Finalizar llamada";
    return "Iniciar llamada";
  };

  //crear una nueva conversacion
  const handleCreateNewConversation = React.useCallback(async () => {
    console.log("🆕 Creando nueva conversación");

    setSelectedConversation(null);
    setTitleGenerated(false);
    clearVoiceMessages();
    clearDbMessages();
    setMessage("");

    //se debe desconectar de la conversacion actual en caso de que estemos en una llamada
    if (isConnected) {
      console.log("⚠️ Desconectando de conversación actual antes de crear nueva");
      await disconnect();
    }

    console.log("✅ Lista para iniciar nueva conversación (sin conversation_id)");
  }, [isConnected, disconnect, clearVoiceMessages, clearDbMessages]);

  // Manejar click en una conversación
  const handleConversationClick = React.useCallback(async (conversation: Conversation) => {
    console.log("📖 Seleccionando conversación:", conversation.id);

    setSelectedConversation(conversation);
    setTitleGenerated(false); // Resetear el flag cuando se selecciona una conversación

    // Limpiar mensajes anteriores antes de cargar la nueva conversación
    clearVoiceMessages(); // Limpiar mensajes de voz en tiempo real
    clearDbMessages(); // Limpiar mensajes de BD de la conversación anterior

    if (conversation.id) {
      loadMessages(conversation.id);
    }

    // Cerrar sidebar en móvil después de seleccionar
    setSidebarOpen(false);
  }, [clearVoiceMessages, clearDbMessages, loadMessages]);

  // Manejar eliminacion de conversacion
  const handleDeleteConversation = React.useCallback(async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Estas seguro de que quieres eliminar esta conversacion?")) {
      return;
    }

    try {
      setDeletingConversationId(conversationId);
      await deleteConversation(conversationId);

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        clearVoiceMessages();
        clearDbMessages();
      }

      await loadConversations();
    } catch (error) {
      console.error("Error eliminando conversacion:", error);
      alert("Error al eliminar la conversacion.");
    } finally {
      setDeletingConversationId(null);
    }
  }, [selectedConversation?.id, clearVoiceMessages, clearDbMessages, loadConversations]);

  // Manejar envío unificado (Texto + Imágenes o Archivos de texto)
  const handleSendMessage = async (files?: File[], textFile?: File | null) => {
    // Validacion: necesitamos mensaje, iamgenes o archivo de texto
    const hasMessage = message.trim().length > 0;
    const hasImages = files && files.length > 0;
    const hasTextFile = !!textFile;

    if (!hasMessage && !hasImages && !hasTextFile) return;

    // Si hay archivos o imagenes, REQUIERE conexion activa
    //if ((hasImages || hasTextFile) && !isConnected) {
    //  alert("Para enviar archivos o imagenes, primero inicia una llamada.");
    //  return;
    //}

    // ========== MODO VOZ (isConnected = true) ==========
    if (isConnected) {
      // PRIORIDAD 1: Archivo de texto
      if (hasTextFile) {
        try {
          const { readTextFile } = await import("@/app/_helpers/readTextFile");
          const { content, name } = await readTextFile(textFile);
          console.log(`Enviando archivo: ${name} (${content.length} chars)`);
          addUserMessage(`[${name}] ${message.trim() || "Analiza este archivo"}`, true);
          sendFileMessage(message.trim(), content, name);
          setMessage("");
          return;
        } catch (error: any) {
          console.error("Error procesando archivo:", error);
          alert(error.message || "Error al procesar el archivo");
          return;
        }
      }

      // PRIORIDAD 2: Imágenes
      if (hasImages) {
        setIsUploading(true);
        try {
          console.log(`📤 Subiendo ${files.length} imágenes...`);
          const { uploadImage } = await import("@/app/_helpers/uploadImage");
          const uploadPromises = files.map(file => uploadImage(file));
          const urls = await Promise.all(uploadPromises);
          const validUrls = urls.filter((url): url is string => url !== null);
          if (validUrls.length > 0) {
            console.log("✅ Imágenes subidas:", validUrls);
            addUserMessage(message.trim(), true, validUrls);
            sendMultimodalMessage(message.trim(), validUrls);
            setMessage("");
          } else {
            alert("Error al subir las imágenes.");
          }
        } catch (error) {
          console.error("Error procesando imágenes:", error);
        } finally {
          setIsUploading(false);
        }
        return;
      }

      // PRIORIDAD 3: Solo texto (en llamada)
      if (hasMessage && sendTextMessage) {
        const trimmedMessage = message.trim();
        addUserMessage(trimmedMessage, true); // Mostrar en el chat local
        sendTextMessage(trimmedMessage); // Enviar al bot
        setMessage("");
      }
      return;
    }

    // ========== MODO TEXTO (isConnected = false) ==========
    if (hasMessage || hasImages || hasTextFile) {
      let targetConversationId = selectedConversation?.id;
      // Si no hay conversacion, crear una nueva
      if (!targetConversationId) {
        console.log("📝 Creando conversacion para chat de texto...");
        const newId = await saveConversation();
        if (newId) {
          targetConversationId = newId;
          setSelectedConversation({
            id: newId,
            title: `Conversación del ${new Date().toLocaleDateString("es-MX")}`,
          });
          setTitleGenerated(false);
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          alert("Error al crear la conversación");
          return;
        }
      }
      // Preparar archivos
      const allFiles: File[] = [];
      if (files && files.length > 0) allFiles.push(...files);
      if (textFile) allFiles.push(textFile);
      // IMÁGENES: Subir al storage como en modo VOZ
      let imageUrls: string[] = [];
      if (hasImages) {
        setIsUploading(true);
        try {
          const { uploadImage } = await import("@/app/_helpers/uploadImage");
          const uploadPromises = files!.map(file => uploadImage(file));
          const urls = await Promise.all(uploadPromises);
          imageUrls = urls.filter((url): url is string => url !== null);
          console.log("✅ Imágenes subidas:", imageUrls);
        } catch (error) {
          console.error("Error subiendo imágenes:", error);
        } finally {
          setIsUploading(false);
        }
      }
      // Mostrar mensaje del usuario INMEDIATAMENTE (como en modo VOZ)
      const displayMessage = hasTextFile
        ? `${message.trim()} 📄 [${textFile!.name}]`
        : message.trim() || "[Imagen]";
      addUserMessageFinal(displayMessage, imageUrls.length > 0 ? imageUrls : undefined);
      const messageToSend = message.trim();
      setMessage("");

      // Capturar frame de cámara si está disponible (para ver_camara)
      let cameraImage: string | undefined;
      if (localVideoStream) {
        try {
          const { captureFrameFromStream } = await import("@/app/_helpers/captureFrame");
          const frame = await captureFrameFromStream(localVideoStream);
          if (frame) {
            cameraImage = frame;
            console.log("📷 Frame de cámara capturado para chat de texto");
          }
        } catch (err) {
          console.error("Error capturando frame de cámara:", err);
        }
      }

      // Enviar al API con imagen de cámara si disponible
      await sendTextChatMessage(messageToSend, targetConversationId!, userId, allFiles.length > 0 ? allFiles : undefined, imageUrls.length > 0 ? imageUrls : undefined, cameraImage);
    }
  };

  // Manejar el evento de presionar Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = React.useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }, [supabase.auth, router]);

  // Deprecated: Eliminamos handleImageUpload simple anterior ya que ahora lo maneja handleSendMessage
  // const handleImageUpload = ...

  return (
    <div className="flex h-screen bg-[#050B14] overflow-hidden relative selection:bg-[#00E599] selection:text-black font-sans text-slate-200">

      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* Backdrop para móvil */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversationsList}
        selectedId={selectedConversation?.id}
        onSelect={handleConversationClick}
        onDelete={handleDeleteConversation}
        onCreate={handleCreateNewConversation}
        onLogout={handleLogout}
        deletingId={deletingConversationId}
      />

      {/* Área principal del chat */}
      <main className="flex-1 flex flex-col w-full relative z-10 bg-transparent">
        {/* Header */}
        <header className="h-14 md:h-16 border-b border-white/5 bg-white/5 backdrop-blur-md px-3 md:px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")} // Volver a "casa"
              className="shrink-0 mr-2 text-slate-400 hover:text-[#00E599] hover:bg-white/5"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 lg:hidden text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex shrink-0 text-slate-400 hover:text-white hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 md:w-6 md:h-6 text-[#00E599]" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-sm md:text-base truncate text-slate-100">
                  {selectedConversation?.title || "Asistente Virtual"}
                </h1>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  {isConnecting ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />{" "}
                      Conectando...
                    </>
                  ) : isConnected ? (
                    <>
                      <span className={`w-2 h-2 rounded-full animate-pulse ${isBotSpeaking ? "bg-blue-500" : "bg-green-500"}`} />{" "}
                      {isBotSpeaking ? (
                        <span className="text-blue-400 font-medium">Sonora hablando...</span>
                      ) : (
                        <span className="text-[#00E599] font-medium">Te escucho...</span>
                      )}
                    </>
                  ) : (
                    "En línea"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Boton de Camara (Siempre visible) */}
          <Button
            variant="secondary"
            size="icon"
            className={`shrink-0 mr-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 ${!isInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={toggleCamera}
            disabled={!isInitialized}
            title={isCameraOn ? "Apagar camara" : "Encender camara"}
          >
            {isCameraOn ? (
              <Video className="w-4 h-4" />
            ) : (
              <VideoOff className="w-4 h-4" />
            )}
          </Button>

          {/* Boton de llamada */}
          <Button
            variant="default"
            size="icon"
            className={`shrink-0 ${isConnected
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50"
              : "bg-[#00E599] text-slate-900 hover:bg-[#00E599]/90 font-bold shadow-[0_0_15px_rgba(0,229,153,0.3)]"
              } md:w-auto md:px-5 transition-all duration-300`}
            onClick={handleCallToggle}
            disabled={!isInitialized || (!!error && !isConnected) || isConnecting}
          >
            {isConnected ? (
              <PhoneOff className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            <span className="hidden md:inline ml-2">{getCallButtonText()}</span>
          </Button>
        </header>

        {/* Indicador de reconexión: Solo si hay historial real */}
        {selectedConversation?.id && isConnected && dbMessages.length > 0 && (
          <div className="bg-[#00E599]/10 border border-[#00E599]/20 text-[#00E599] px-4 py-3 mx-3 md:mx-4 mt-3 md:mt-4 rounded-xl backdrop-blur-sm">
            <p className="text-sm">
              📖 <strong>Continuando conversación anterior</strong> - El historial ha sido cargado
            </p>
          </div>
        )}

        {/* Mensaje de error de Pipecat */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 mx-3 md:mx-4 mt-3 md:mt-4 rounded-xl backdrop-blur-sm">
            <p className="text-sm">
              <strong>Error de conexión:</strong> {error}
            </p>
          </div>
        )}

        {/* Mensaje de error del chat de texto */}
        {textChatError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 mx-3 md:mx-4 mt-3 md:mt-4 rounded-xl backdrop-blur-sm">
            <p className="text-sm">
              <strong>Error en el chat:</strong> {textChatError}
            </p>
          </div>
        )}

        {/* Área de mensajes */}
        <ChatArea
          messages={allMessages}
          isLoading={isLoadingMessages}
          hasSelectedConversation={!!selectedConversation}
          isTyping={textChatLoading}
        />

        {/* Input de mensajes */}
        <ChatControls
          message={message}
          onMessageChange={setMessage}
          isRecording={isRecording}
          onToggleRecording={() => setIsRecording(!isRecording)}
          isConnected={isConnected}
          isUploading={isUploading || textChatLoading}
          onSendMessage={handleSendMessage}
          onKeyDown={handleKeyDown}
        />
        {/* Camera Preview */}
        <VideoPreview stream={localVideoStream} isCameraOn={isCameraOn} />
      </main>
    </div>
  );
}
