import { NextRequest, NextResponse } from "next/server";

const PIPECAT_CHAT_URL = process.env.PIPECAT_CHAT_URL || "http://localhost:7861/api/chat";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, conversationId, userId, cameraImage } = body;

        if (!message || !conversationId) {
            return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
        }

        const response = await fetch(PIPECAT_CHAT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                conversation_id: conversationId,
                user_id: userId,
                camera_image: cameraImage, // Imagen de cámara para ver_camara
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json({ error }, { status: response.status });
        }

        const reader = response.body?.getReader();
        if (!reader) {
            return NextResponse.json({ error: "No stream" }, { status: 500 });
        }

        const stream = new ReadableStream({
            async start(controller) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    controller.enqueue(value);
                }
                controller.close();
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error: any) {
        console.error("Error en proxy chat:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}