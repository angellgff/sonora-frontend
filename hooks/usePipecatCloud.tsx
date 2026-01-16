"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
    PipecatClient,
    TranscriptData,
    BotLLMTextData,
} from "@pipecat-ai/client-js";
import { DailyTransport } from "@pipecat-ai/daily-transport";

export interface PipecatCloudCallbacks {
    onUserTranscript?: (data: TranscriptData) => void;
    onBotTranscript?: (data: BotLLMTextData) => void;
    onBotStartedSpeaking?: () => void;
    onBotStoppedSpeaking?: () => void;
}

export function usePipecatCloud(callbacks?: PipecatCloudCallbacks) {
    const clientRef = useRef<PipecatClient | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);

    const pendingConversationIdRef = useRef<string | null>(null);
    const pendingUserIdRef = useRef<string | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isBotSpeaking, setIsBotSpeaking] = useState(false);

    // Inicialización del cliente
    useEffect(() => {
        if (!audioElementRef.current) {
            const audioElement = document.createElement("audio");
            audioElement.autoplay = true;
            audioElementRef.current = audioElement;
            console.log("🔊 Elemento de audio creado");
        }

        const transport = new DailyTransport({
            bufferLocalAudioUntilBotReady: true,
        });

        const pipecatClient = new PipecatClient({
            transport,
            enableMic: true,
            enableCam: false,
            callbacks: {
                onConnected: () => {
                    setIsConnected(true);
                    setIsConnecting(false);
                    setError(null);
                    console.log("✅ Conectado a Pipecat Cloud");
                },
                onBotConnected: () => {
                    console.log("🤖 Bot conectado - enviando conversation_id");
                    // Enviar conversation_id cuando el bot se conecta
                    if (clientRef.current && pendingConversationIdRef.current) {
                        setTimeout(async () => {
                            try {
                                if (clientRef.current) {
                                    clientRef.current.sendClientMessage("action", {
                                        action: "set_conversation_id",
                                        arguments: {
                                            conversation_id: pendingConversationIdRef.current,
                                            user_id: pendingUserIdRef.current,
                                        },
                                    });
                                    console.log("✅ Mensaje set_conversation_id enviado");
                                }
                            } catch (error) {
                                console.error("❌ Error enviando conversation_id:", error);
                            }
                        }, 2500); // 2.5 segundos de delay (igual que el hook original)
                    }
                },
                onDisconnected: () => {
                    setIsConnected(false);
                    setIsConnecting(false);
                    console.log("❌ Desconectado de Pipecat Cloud");
                },
                onBotStartedSpeaking: () => {
                    setIsBotSpeaking(true);
                    callbacks?.onBotStartedSpeaking?.();
                },
                onBotStoppedSpeaking: () => {
                    setIsBotSpeaking(false);
                    callbacks?.onBotStoppedSpeaking?.();
                },
                onUserTranscript: (data: TranscriptData) => {
                    if (data.final) {
                        console.log("👤 Usuario:", data.text);
                        callbacks?.onUserTranscript?.(data);
                    }
                },
                onBotTranscript: (data: BotLLMTextData) => {
                    console.log("🤖 Bot:", data.text);
                    callbacks?.onBotTranscript?.(data);
                },
                onError: (error) => {
                    console.error("❌ Error:", error);
                    setError(String(error) || "Error de conexión");
                    setIsConnecting(false);
                },
                onTrackStarted: (track, participant) => {
                    if (track.kind === "audio" && participant?.local === false) {
                        const audioElement = audioElementRef.current;
                        if (audioElement) {
                            audioElement.srcObject = new MediaStream([track]);
                        }
                    }
                },
            },
        });

        clientRef.current = pipecatClient;
        setIsInitialized(true);

        return () => {
            pipecatClient.disconnect();
        };
    }, []);

    // Actualizar callbacks cuando cambien
    useEffect(() => {
        if (clientRef.current && callbacks) {
            // Los callbacks se manejan en la inicialización
        }
    }, [callbacks]);

    const connect = useCallback(
        async (conversationId?: string, userId?: string) => {
            if (!clientRef.current || !isInitialized) {
                setError("El cliente no está inicializado");
                return;
            }

            try {
                setError(null);
                setIsConnecting(true);

                console.log("🔄 Iniciando conexión a Pipecat Cloud...");

                pendingConversationIdRef.current = conversationId || null;
                pendingUserIdRef.current = userId || null;

                // 1. Obtener URL y token de Daily desde nuestra API
                const startResponse = await fetch("/api/voice/start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ conversationId, userId }),
                });

                if (!startResponse.ok) {
                    const errorData = await startResponse.json();
                    throw new Error(errorData.error || "Error al iniciar sesión");
                }

                const { url, token } = await startResponse.json();

                console.log("📡 Daily room obtenida:", url);

                // 2. Conectar con DailyTransport
                await clientRef.current.connect({
                    url,
                    token,
                });

                console.log("✅ Conexión iniciada");
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Error al conectar";
                setError(errorMessage);
                setIsConnecting(false);
                console.error("❌ Error al conectar:", err);
            }
        },
        [isInitialized]
    );

    const disconnect = useCallback(async () => {
        if (!clientRef.current) return;

        try {
            await clientRef.current.disconnect();
            setError(null);
        } catch (err) {
            console.error("Error al desconectar:", err);
        }
    }, []);

    const sendTextMessage = useCallback(
        async (text: string) => {
            if (!clientRef.current || !isConnected) {
                console.warn("No conectado, no se puede enviar mensaje");
                return;
            }

            try {
                await clientRef.current.sendClientMessage("user-text-message", {
                    text,
                });
            } catch (err) {
                console.error("Error enviando mensaje:", err);
            }
        },
        [isConnected]
    );

    // Funciones placeholder para compatibilidad con la interfaz existente
    // Estas funciones no están disponibles con DailyTransport en producción
    const localVideoStream = null;
    const isCameraOn = false;

    const toggleCamera = useCallback(async () => {
        console.warn("toggleCamera no disponible en modo Cloud");
    }, []);

    const sendImageMessage = useCallback(async (_imageUrl: string) => {
        console.warn("sendImageMessage no disponible en modo Cloud");
    }, []);

    const sendMultimodalMessage = useCallback(async (_text: string, _imageUrls: string[]) => {
        console.warn("sendMultimodalMessage no disponible en modo Cloud");
    }, []);

    const sendFileMessage = useCallback(async (_text: string, _content: string, _fileName: string) => {
        console.warn("sendFileMessage no disponible en modo Cloud");
    }, []);

    return {
        connect,
        disconnect,
        sendTextMessage,
        isConnected,
        isConnecting,
        isInitialized,
        isBotSpeaking,
        error,
        // Funciones adicionales para compatibilidad
        localVideoStream,
        isCameraOn,
        toggleCamera,
        sendImageMessage,
        sendMultimodalMessage,
        sendFileMessage,
    };
}
