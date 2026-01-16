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

        // Log para depuración
        console.log("PIPECAT_CLOUD_API_KEY:", PIPECAT_API_KEY ? `${PIPECAT_API_KEY.substring(0, 10)}...` : "NOT SET");
        console.log("AGENT_NAME:", AGENT_NAME);
        console.log("Calling:", `${PIPECAT_CLOUD_API}/${AGENT_NAME}/start`);

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

        // Log para ver la estructura de la respuesta
        console.log("Pipecat Cloud response:", JSON.stringify(data, null, 2));

        // Retornar URL y token de Daily (verificar nombres de campos)
        return NextResponse.json({
            url: data.room_url || data.roomUrl || data.url,
            token: data.token || data.meetingToken,
            sessionId: data.session_id || data.sessionId,
        });

    } catch (error) {
        console.error("Error starting voice session:", error);
        return NextResponse.json(
            { error: "Failed to start voice session" },
            { status: 500 }
        );
    }
}
