import { NextRequest, NextResponse } from "next/server";

const PIPECAT_UPLOAD_URL = process.env.PIPECAT_CHAT_URL?.replace("/chat", "/upload") || "http://localhost:7861/api/upload";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        // Reenviar el formData al backend
        const response = await fetch(PIPECAT_UPLOAD_URL, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json({ error }, { status: response.status });
        }

        // Hacer proxy del stream
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
        console.error("Error en proxy upload:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}