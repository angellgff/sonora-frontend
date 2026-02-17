import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
} from "docx";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId");

        if (!conversationId) {
            return NextResponse.json({ error: "Falta el ID de la conversación" }, { status: 400 });
        }

        const supabase = getSupabase();

        // 1. Obtener datos de la conversación
        const { data: conversation, error: convError } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", conversationId)
            .single();

        if (convError || !conversation) {
            return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
        }

        // 2. Obtener mensajes
        const { data: messages, error: msgError } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .is("deleted_at", null)
            .order("created_at", { ascending: true });

        if (msgError) {
            return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
        }

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "La conversación no tiene mensajes" }, { status: 400 });
        }

        // 3. Construir el documento DOCX
        const title = conversation.title || "Conversación";
        const dateStr = new Date(conversation.created_at).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const children: Paragraph[] = [];

        // Título
        children.push(
            new Paragraph({
                children: [new TextRun({ text: title, bold: true, size: 32, font: "Calibri" })],
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
            })
        );

        // Fecha
        children.push(
            new Paragraph({
                children: [new TextRun({ text: `Fecha: ${dateStr}`, size: 20, color: "666666", font: "Calibri" })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
            })
        );

        // Línea separadora
        children.push(
            new Paragraph({
                border: {
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                },
                spacing: { after: 200 },
            })
        );

        // Mensajes
        for (const msg of messages) {
            const isUser = msg.role === "user";
            const senderName = isUser ? "Usuario" : "Sonora";
            const content = msg.content || msg.text_content || "";
            const time = new Date(msg.created_at).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
            });

            // Nombre del remitente + hora
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${senderName}`,
                            bold: true,
                            size: 22,
                            color: isUser ? "1A73E8" : "00B074",
                            font: "Calibri",
                        }),
                        new TextRun({
                            text: `  ${time}`,
                            size: 18,
                            color: "999999",
                            font: "Calibri",
                        }),
                    ],
                    spacing: { before: 200, after: 40 },
                })
            );

            // Limpiar contenido (removing markdown symbols for docx)
            const cleanedContent = content
                .replace(/\*\*(.*?)\*\*/g, "$1") // Quitar negritas markdown
                .replace(/\*(.*?)\*/g, "$1") // Quitar itálicas
                .replace(/#{1,6}\s/g, "") // Quitar headers
                .replace(/```[\s\S]*?```/g, (match: string) => match.replace(/```\w*\n?/g, "").trim()) // Limpiar code blocks
                .replace(/`(.*?)`/g, "$1") // Quitar inline code
                .replace(/\[CONTENIDO DE ARCHIVOS\]:[\s\S]*/g, "") // Limpiar archivos adjuntos
                .trim();

            // Contenido del mensaje
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: cleanedContent,
                            size: 21,
                            font: "Calibri",
                        }),
                    ],
                    spacing: { after: 100 },
                })
            );
        }

        // Footer
        children.push(
            new Paragraph({
                border: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                },
                spacing: { before: 400, after: 100 },
            })
        );
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Exportado desde Sonora — ${new Date().toLocaleDateString("es-MX")}`,
                        size: 18,
                        color: "999999",
                        italics: true,
                        font: "Calibri",
                    }),
                ],
                alignment: AlignmentType.CENTER,
            })
        );

        const doc = new Document({
            sections: [{ children }],
        });

        const buffer = await Packer.toBuffer(doc);
        const uint8 = new Uint8Array(buffer);

        const safeTitle = title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, "").replace(/\s+/g, "_").substring(0, 50);
        const filename = `${safeTitle}.docx`;

        return new NextResponse(uint8, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error("Error exportando conversación:", error);
        return NextResponse.json({ error: error.message || "Error al exportar" }, { status: 500 });
    }
}
