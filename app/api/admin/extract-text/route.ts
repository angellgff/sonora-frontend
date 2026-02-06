import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import mammoth from "mammoth";

// Configuración para Vercel / Next.js
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Forzar runtime de Node.js para soporte de Buffer y dependencias nativas

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
        }

        console.log(`📂 Extrayendo texto de: ${file.name} (${file.type})`);

        const buffer = Buffer.from(await file.arrayBuffer());
        let textContent = "";

        // 1. Extraer Texto según el tipo de archivo
        if (file.type === "application/pdf") {
            try {
                const data = await pdf(buffer);
                textContent = data.text;
            } catch (pdfError: any) {
                console.error("❌ Critical PDF Parse Error:", pdfError);
                throw new Error(`Error interno leyendo el PDF: ${pdfError.message || 'Estructura no soportada'}`);
            }
        } else if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            const result = await mammoth.extractRawText({ buffer });
            textContent = result.value;
        } else if (file.type === "text/plain") {
            textContent = buffer.toString("utf-8");
        } else {
            return NextResponse.json({ error: "Formato no soportado. Usa PDF, DOCX o TXT." }, { status: 400 });
        }

        // Limpieza básica
        textContent = textContent.replace(/\s+/g, " ").trim();

        if (!textContent) {
            return NextResponse.json({ error: "El archivo está vacío o no tiene texto legible." }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            text: textContent,
            metadata: {
                name: file.name,
                type: file.type,
                size: file.size
            }
        });

    } catch (error: any) {
        console.error("❌ Error en extracción:", error);
        return NextResponse.json({ error: error.message || "Error procesando el archivo" }, { status: 500 });
    }
}
