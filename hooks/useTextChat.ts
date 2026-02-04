"use client";

import { useState, useCallback } from "react";

interface UseTextChatReturn {
    sendTextMessage: (message: string, conversationId: string, userId: string | null, files?: File[], imageUrls?: string[], cameraImage?: string) => Promise<void>;
    isLoading: boolean;
    streamingContent: string;
    error: string | null;
}

export function useTextChat(
    onMessageStart?: () => void,
    onMessageChunk?: (chunk: string) => void,
    onMessageEnd?: (fullMessage: string) => void
): UseTextChatReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [error, setError] = useState<string | null>(null);

    const sendTextMessage = useCallback(
        async (message: string, conversationId: string, userId: string | null, files?: File[], imageUrls?: string[], cameraImage?: string) => {
            if ((!message.trim() && !(files && files.length > 0)) || !conversationId) return;

            setIsLoading(true);
            setStreamingContent("");
            setError(null);
            onMessageStart?.();

            try {
                let response: Response;

                // Si hay archivos, usar el endpoint de upload
                if (files && files.length > 0) {
                    const formData = new FormData();
                    // Enviar todos los archivos
                    files.forEach(file => {
                        formData.append("files", file);
                    });

                    formData.append("conversation_id", conversationId);
                    if (userId) formData.append("user_id", userId);
                    formData.append("message", message);
                    if (imageUrls && imageUrls.length > 0) {
                        formData.append("image_urls", imageUrls.join(","));
                    }

                    response = await fetch("/api/chat/upload", {
                        method: "POST",
                        body: formData,
                    });
                } else {
                    // chat de texto normal
                    response = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            message,
                            conversationId,
                            userId,
                            cameraImage, // Imagen de cámara en base64
                        }),
                    });
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Error en el chat");
                }

                const reader = response.body?.getReader();
                if (!reader) throw new Error("No se pudo leer la respuesta");

                const decoder = new TextDecoder();
                let fullMessage = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value);
                    const lines = text.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const data = line.slice(6);
                            if (data === "[DONE]") {
                                onMessageEnd?.(fullMessage);
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    fullMessage += parsed.content;
                                    setStreamingContent(fullMessage);
                                    onMessageChunk?.(parsed.content);
                                }
                            } catch {
                                // Ignorar líneas mal formadas
                            }
                        }
                    }
                }
            } catch (err: any) {
                console.error("Error en chat:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        },
        [onMessageStart, onMessageChunk, onMessageEnd]
    );

    return {
        sendTextMessage,
        isLoading,
        streamingContent,
        error,
    };
}