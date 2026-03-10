import { NextRequest, NextResponse } from "next/server";

const PIPECAT_AGENTS_URL = process.env.PIPECAT_AGENTS_URL || "http://localhost:7861/api/agents";

// POST: Crear un nuevo agente (FormData proxying)
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        
        // Proxy formData al backend de Python
        const response = await fetch(PIPECAT_AGENTS_URL, {
            method: "POST",
            body: formData, // fetch maneja forms sin necesidad de content-type
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.detail || "Error del servidor de IA" }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error en proxy de creación de agentes:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Borrar un agente
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const agentId = searchParams.get("id");

        if (!agentId) {
            return NextResponse.json({ error: "Falta ID de agente" }, { status: 400 });
        }

        const response = await fetch(`${PIPECAT_AGENTS_URL}/${agentId}`, {
            method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.detail || "Error del servidor de IA" }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error en proxy de eliminación de agentes:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
