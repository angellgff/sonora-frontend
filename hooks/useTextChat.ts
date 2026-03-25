"use client";

import { useState, useCallback, useRef } from "react";

interface UseTextChatReturn {
    sendTextMessage: (message: string, conversationId: string, userId: string | null, files?: File[], imageUrls?: string[], cameraImage?: string, pilarId?: number | null, agentId?: string | null) => Promise<void>;
    isLoading: boolean;
    isStreaming: boolean;
    streamingContent: string;
    error: string | null;
    stop: () => void;
}

export function useTextChat(
    onMessageStart?: () => void,
    onMessageChunk?: (chunk: string) => void,
    onMessageEnd?: (fullMessage: string) => void
): UseTextChatReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const stop = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    const sendTextMessage = useCallback(
        async (message: string, conversationId: string, userId: string | null, files?: File[], imageUrls?: string[], cameraImage?: string, pilarId?: number | null, agentId?: string | null) => {
            if ((!message.trim() && !(files && files.length > 0)) || !conversationId) return;

            const controller = new AbortController();
            abortRef.current = controller;

            setIsLoading(true);
            setIsStreaming(false);
            setStreamingContent("");
            setError(null);
            onMessageStart?.();

            try {
                let response: Response;

                // Si hay archivos, usar el endpoint de upload
                if (files && files.length > 0) {
                    const formData = new FormData();
                    files.forEach(file => { formData.append("files", file); });
                    formData.append("conversation_id", conversationId);
                    if (userId) formData.append("user_id", userId);
                    formData.append("message", message);
                    if (imageUrls && imageUrls.length > 0) formData.append("image_urls", imageUrls.join(","));
                    if (pilarId) formData.append("pilar_id", pilarId.toString());
                    if (agentId) formData.append("agent_id", agentId);
                    response = await fetch("/api/chat/upload", { method: "POST", body: formData, signal: controller.signal });
                } else {
                    // chat de texto normal
                    console.log("🚀 Payload a Next.js /api/chat:", { message, conversationId, agentId });
                    response = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message, conversationId, userId, cameraImage, pilarId, agentId }),
                        signal: controller.signal,
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
                setIsStreaming(true);

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
                            } catch { /* ignore malformed */ }
                        }
                    }
                }
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    // stopped by user — call onMessageEnd with what we have so far
                    onMessageEnd?.(streamingContent || "");
                } else {
                    console.error("Error en chat:", err);
                    setError(err.message);
                }
            } finally {
                setIsLoading(false);
                setIsStreaming(false);
                abortRef.current = null;
            }
        },
        [onMessageStart, onMessageChunk, onMessageEnd]
    );

    return { sendTextMessage, isLoading, isStreaming, streamingContent, error, stop };
}