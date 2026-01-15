import { NextRequest, NextResponse } from "next/server";

const PIPECAT_CLOUD_API = "https://api.pipecat.daily.co/v1/public";
const PIPECAT_API_KEY = process.env.PIPECAT_CLOUD_API_KEY || "";
const AGENT_NAME = process.env.PIPECAT_AGENT_NAME || "sonora-voice";

export async function POST(request: NextRequest) {
    try {
        // Opcional: recibir datos adicionales del cliente
        let body = {};
        try {
            body = await request.json();
        } catch {
            // Sin body está bien
        }

        // Llamar a Pipecat Cloud para iniciar sesión
        const response = await fetch(`${PIPECAT_CLOUD_API}/${AGENT_NAME}/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${PIPECAT_API_KEY}`,
            },
            body: JSON.stringify({
                createDailyRoom: true,
                // Pasar datos adicionales al agente si los hay
                ...(body && { body }),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error from Pipecat Cloud:", errorText);
            return NextResponse.json(
                { error: `Pipecat Cloud error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Retornar URL y token de Daily
        return NextResponse.json({
            url: data.room_url,
            token: data.token,
            sessionId: data.session_id,
        });

    } catch (error) {
        console.error("Error starting voice session:", error);
        return NextResponse.json(
            { error: "Failed to start voice session" },
            { status: 500 }
        );
    }
}
