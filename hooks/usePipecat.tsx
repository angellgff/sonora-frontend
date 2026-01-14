"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  PipecatClient,
  RTVIMessage,
  ErrorData,
  TranscriptData,
  BotLLMTextData,
  Participant,
} from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";

// Tipos para los callbacks opcionales
export interface PipecatCallbacks {
  onUserTranscript?: (data: TranscriptData) => void;
  onBotTranscript?: (data: BotLLMTextData) => void;
  onBotStartedSpeaking?: () => void;
  onBotStoppedSpeaking?: () => void;
}

export function usePipecat(
  serverUrl: string = "https://sonora-api.1411sas.com",
  callbacks?: PipecatCallbacks
) {
  const clientRef = useRef<PipecatClient | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const localVideoStreamRef = useRef<MediaStream | null>(null);

  // 🆕 Referencia para almacenar el conversation_id pendiente
  const pendingConversationIdRef = useRef<string | null>(null);
  const pendingUserIdRef = useRef<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  // Inicialización del cliente (solo una vez)
  useEffect(() => {
    // Crear elemento de audio para reproducir la voz del bot
    if (!audioElementRef.current) {
      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElementRef.current = audioElement;
      console.log("🔊 Elemento de audio creado");
    }

    const transport = new SmallWebRTCTransport();
    const pipecatClient = new PipecatClient({
      transport,
      enableMic: true,
      enableCam: false,
      callbacks: {
        onConnected: () => {
          setIsConnected(true);
          setError(null);
          console.log("✅ Conectado a Pipecat");

          // 🆕 ENVIAR conversation_id (o null) siempre
          if (clientRef.current) {
            console.log(
              "📤 Enviando conversation_id pendiente:",
              pendingConversationIdRef.current
            );

            // Pequeño delay para asegurar que el pipeline está listo
            setTimeout(() => {
              if (clientRef.current) {
                try {
                  console.log(
                    "📤 Enviando configuración de conversación:",
                    pendingConversationIdRef.current
                  );
                  clientRef.current.sendClientMessage("action", {
                    action: "set_conversation_id",
                    arguments: {
                      conversation_id: pendingConversationIdRef.current || null,
                      user_id: pendingUserIdRef.current || null,
                    },
                  });
                  console.log("✅ Mensaje set_conversation_id enviado");
                } catch (error) {
                  console.error("❌ Error enviando conversation_id:", error);
                }
              }
            }, 2500); // 2.5 segundos de delay
          } else {
            // Esto ya no debería ejecutarse porque siempre entramos al if anterior si clientRef existe,
            // pero mantenemos la estructura lógica limpia.
            // En realidad, el bloque anterior estaba condicionado a pendingConversationIdRef.current.
            // Vamos a simplificarlo para que SIEMPRE se ejecute.
          }
        },
        onDisconnected: () => {
          setIsConnected(false);
          setIsBotSpeaking(false);
          // Limpiar conversation_id pendiente
          pendingConversationIdRef.current = null;
          console.log("❌ Desconectado de Pipecat");
        },
        onError: (message: RTVIMessage) => {
          const errorData = message.data as ErrorData;
          setError(errorData?.message || "Error de conexión desconocido");
        },
        // Capturar el track de audio del bot
        onTrackStarted: (
          track: MediaStreamTrack,
          participant?: Participant
        ) => {
          console.log(
            "🎵 Track started:",
            track.kind,
            "participant:",
            participant
          );

          // capturar video local para preview
          if (track.kind === "video" && participant?.local) {
            console.log("Video local capturado para preview");
            localVideoStreamRef.current = new MediaStream([track]);
          }

          // Con SmallWebRTC, el audio del bot llega sin participant o con participant.local = false
          // El audio del usuario se captura directamente del micrófono, no llega como track remoto
          if (track.kind === "audio") {
            // Si hay participant, verificar que no sea local (usuario)
            // Si no hay participant (undefined), asumimos que es del bot
            const shouldPlay = !participant?.local;

            if (shouldPlay) {
              console.log("🔊 Reproduciendo audio del bot");
              const stream = new MediaStream([track]);

              if (audioElementRef.current) {
                audioElementRef.current.srcObject = stream;
                audioElementRef.current.volume = 1; // Volumen al máximo

                audioElementRef.current.play().catch((err) => {
                  console.error("❌ Error al reproducir audio:", err);
                  setError(
                    "Error al reproducir audio del bot. Intenta hacer clic en la página."
                  );
                });
              }
            } else {
              console.log("⏭️ Ignorando audio local (del usuario)");
            }
          }
        },
        // Eventos de transcripción del usuario
        onUserTranscript: (data: TranscriptData) => {
          if (callbacks?.onUserTranscript) {
            callbacks.onUserTranscript(data);
          }
        },
        // Eventos de transcripción del bot
        onBotTranscript: (data: BotLLMTextData) => {
          if (callbacks?.onBotTranscript) {
            callbacks.onBotTranscript(data);
          }
        },
        // Eventos de cuando el bot empieza a hablar
        onBotStartedSpeaking: () => {
          setIsBotSpeaking(true);
          if (callbacks?.onBotStartedSpeaking) {
            callbacks.onBotStartedSpeaking();
          }
        },
        // Eventos de cuando el bot termina de hablar
        onBotStoppedSpeaking: () => {
          setIsBotSpeaking(false);
          if (callbacks?.onBotStoppedSpeaking) {
            callbacks.onBotStoppedSpeaking();
          }
        },
      },
    });

    clientRef.current = pipecatClient;

    // Inicializar dispositivos de audio/video
    pipecatClient
      .initDevices()
      .then(async () => {
        setIsInitialized(true);
        // NO iniciar cámara automáticamente
        // La cámara se iniciará solo cuando el usuario la active
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Error al inicializar dispositivos"
        );
      });

    // Cleanup: desconectar y limpiar al desmontar
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect().catch(console.error);
        clientRef.current = null;
        if (localVideoStreamRef.current) {
          localVideoStreamRef.current.getTracks().forEach(track => track.stop());
          localVideoStreamRef.current = null;
          setLocalVideoStream(null);
        }
      }

      // Limpiar el elemento de audio
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.srcObject = null;
      }
    };
  }, [serverUrl, callbacks]);

  const connect = useCallback(
    async (conversationId?: string, userId?: string) => {
      if (!clientRef.current || !isInitialized) {
        setError("El cliente no está inicializado");
        return;
      }

      try {
        setError(null);

        console.log("🔄 Iniciando conexión...", {
          conversationId: conversationId || "nueva",
        });

        // 🆕 Guardar el conversation_id en la ref ANTES de conectar
        pendingConversationIdRef.current = conversationId || null;
        pendingUserIdRef.current = userId || null;

        if (conversationId) {
          console.log(
            "📝 conversation_id guardado para enviar después de conectar"
          );
        }

        // Conectar (sin body)
        await clientRef.current.connect({
          webrtcRequestParams: {
            endpoint: `${serverUrl}/api/offer`,
          },
        });

        // Este log probablemente nunca se ejecuta debido al bug de Pipecat
        console.log("✅ connect() completado");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al conectar";
        setError(errorMessage);
        console.error("❌ Error al conectar con Pipecat:", err);
      }
    },
    [isInitialized, serverUrl]
  );

  const disconnect = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      await clientRef.current.disconnect();
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al desconectar";
      setError(errorMessage);
      console.error("Error al desconectar:", err);
    }
  }, []);

  /**
   * Enviar un mensaje de texto directamente al pipeline de Pipecat
   * El servidor debe estar configurado para manejar mensajes de tipo "user_text_message"
   */
  const sendTextMessage = useCallback(
    (text: string) => {
      if (!clientRef.current || !isConnected) {
        console.error("❌ No se puede enviar mensaje: cliente no conectado");
        return;
      }

      try {
        // Enviar mensaje personalizado al servidor (método síncrono)
        clientRef.current.sendClientMessage("user_text_message", {
          text: text,
        });
        console.log("📤 Mensaje de texto enviado:", text);
      } catch (err) {
        console.error("❌ Error al enviar mensaje de texto:", err);
        throw err;
      }
    },
    [isConnected]
  );

  /**
   * Enviar mensaje multimodal (Texto + URLs de imagenes)
   */
  const sendMultimodalMessage = useCallback(
    (text: string, imageUrls: string[]) => {
      if (!clientRef.current || !isConnected) {
        console.error("No se puede enviar mensaje multimodal: cliente no conectado");
        return;
      }

      try {
        clientRef.current.sendClientMessage("user_multimodal_message", {
          text: text,
          image_urls: imageUrls,
        });
        console.log("📤 Mensaje multimodal enviado:", { text, imageUrls });
      } catch (err) {
        console.error("Error al enviar mensaje multimodal:", err);
        throw err;
      }
    },
    [isConnected]
  );

  /**
   * Enviar mensaje con archivo de texto
   */
  const sendFileMessage = useCallback(
    (text: string, fileContent: string, fileName: string) => {
      if (!clientRef.current || !isConnected) {
        console.error("No se puede enviar archivo: cliente no conectado");
        return;
      }

      try {
        clientRef.current.sendClientMessage("user_file_message", {
          text: text,
          file_content: fileContent,
          file_name: fileName,
        });
        console.log("Archivo enviado al bot:", fileName);
      } catch (err) {
        console.error("Error al enviar archivo:", err);
        throw err;
      }
    },
    [isConnected]
  );

  // Mantenemos sendImageMessage por compatibilidad, aunque ahora usaremos multimodal
  const sendImageMessage = useCallback(
    (base64Image: string) => {
      if (!clientRef.current || !isConnected) {
        console.error("No se puede enviar imagen: cliente no conectado");
        return;
      }

      try {
        clientRef.current.sendClientMessage("user_image", {
          image: base64Image,
        });
        console.log("Imagen enviada al bot");
      } catch (err) {
        console.error("Error al enviar imagen:", err);
        throw err;
      }
    },
    [isConnected]
  );

  const toggleCamera = useCallback(async () => {
    if (!clientRef.current) return;

    const newState = !isCameraOn;
    setIsCameraOn(newState);

    try {
      // Solo comunicar al servidor si estamos conectados
      if (isConnected && clientRef.current.enableCam) {
        await clientRef.current.enableCam(newState);
      }

      if (newState) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        setLocalVideoStream(stream);
        localVideoStreamRef.current = stream;
      } else {
        setLocalVideoStream(null);
        if (localVideoStreamRef.current) {
          localVideoStreamRef.current.getTracks().forEach(t => t.stop());
          localVideoStreamRef.current = null;
        }
      }
    } catch (err) {
      console.error("Error toggling camera", err);
      // Revertir estado si falla
      setIsCameraOn(!newState);
    }
  }, [isCameraOn, isConnected]);

  return {
    client: clientRef.current,
    isConnected,
    isInitialized,
    isBotSpeaking,
    isCameraOn,
    error,
    connect,
    disconnect,
    toggleCamera,
    sendTextMessage,
    sendImageMessage,
    sendMultimodalMessage,
    sendFileMessage,
    localVideoStream,
  };
}
