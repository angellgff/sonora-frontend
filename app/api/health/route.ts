import { NextResponse } from "next/server";

const BACKEND_HEALTH_URL = process.env.PIPECAT_CHAT_URL?.replace("/api/chat", "/health") || "http://localhost:7861/health";

export async function GET() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch(BACKEND_HEALTH_URL, {
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
            return NextResponse.json({ status: "ok" });
        }
        return NextResponse.json({ status: "error" }, { status: 503 });
    } catch {
        return NextResponse.json({ status: "error" }, { status: 503 });
    }
}
