import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Configuración para Vercel / Next.js
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getSupabaseAdmin() {
    try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
            throw new Error("❌ CONFIG ERROR: Faltan variables de entorno de Supabase.");
        }
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            serviceRoleKey,
            { auth: { persistSession: false, autoRefreshToken: false } }
        );
    } catch (error) {
        console.error("Error inicializando Supabase Admin:", error);
        throw error;
    }
}

// Método 1: Extraer texto con unpdf (rápido, gratis)
async function extractPdfText(buffer: Buffer): Promise<string> {
    const { extractText } = await import("unpdf");
    const data = new Uint8Array(buffer);
    const result = await extractText(data, { mergePages: false });
    const text = result.text
        .map((page: string) => page.trim())
        .filter((page: string) => page.length > 0)
        .join('\n\n');
    return text;
}

// Método 2: Fallback con OpenAI para PDFs diseñados/escaneados
async function extractPdfWithOpenAI(buffer: Buffer, fileName: string): Promise<string> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log(`🤖 Usando OpenAI para extraer texto de: ${fileName}`);

    // Paso 1: Subir el PDF a OpenAI Files API
    const file = await openai.files.create({
        file: new File([new Uint8Array(buffer)], fileName, { type: "application/pdf" }),
        purpose: "user_data" as any,
    });

    console.log(`📤 PDF subido a OpenAI: file_id=${file.id}`);

    try {
        // Paso 2: Usar Responses API con file_id
        const response = await openai.responses.create({
            model: "gpt-4o-mini",
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_file",
                            file_id: file.id,
                        } as any,
                        {
                            type: "input_text",
                            text: "Extrae ABSOLUTAMENTE TODO el texto de este documento PDF. Incluye:\n- Nombres completos, títulos, cargos\n- Datos de contacto (email, teléfono, dirección, LinkedIn)\n- TODAS las secciones (experiencia, habilidades, formación, certificados, idiomas, etc.)\n- Fechas, nombres de empresas/instituciones\n- Descripciones de puestos y responsabilidades\n\nResponde SOLO con el texto extraído textualmente, sin resúmenes, sin comentarios, sin formato adicional. Extrae cada sección completa.",
                        } as any,
                    ]
                }
            ],
        } as any);

        // Extraer el texto de la respuesta
        const outputText = (response as any).output_text
            || (response as any).output
                ?.filter((item: any) => item.type === "message")
                ?.map((item: any) => item.content?.filter((c: any) => c.type === "output_text")?.map((c: any) => c.text).join(""))
                ?.join("")
            || "";

        return outputText;
    } finally {
        // Limpiar: borrar el archivo de OpenAI
        try {
            await openai.files.delete(file.id);
            console.log(`🗑️ Archivo temporal eliminado de OpenAI`);
        } catch (e) {
            console.warn(`⚠️ No se pudo eliminar archivo temporal de OpenAI: ${file.id}`);
        }
    }
}

export async function POST(req: NextRequest) {
    console.log(`📥 API Hit: /extract-text - Mem: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);

    let storagePath: string | null = null;
    let supabaseAdmin: ReturnType<typeof getSupabaseAdmin> | null = null;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
        }

        console.log(`📂 Extrayendo texto de: ${file.name} (${file.type})`);

        const buffer = Buffer.from(await file.arrayBuffer());
        let textContent = "";

        // 1. Subir archivo original a Storage para descarga futura
        try {
            supabaseAdmin = getSupabaseAdmin();
        } catch (initError: any) {
            return NextResponse.json({ error: "Error de configuración de BD en el servidor. Revisa las variables de entorno." }, { status: 500 });
        }
        
        // Limpiar nombre de archivo para evitar "Invalid key" de Supabase Storage
        const sanitizedFileName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, "_");
        storagePath = `${Date.now()}_${sanitizedFileName}`;

        console.log(`📤 Subiendo archivo a Storage: ${storagePath}`);

        // Intentar subir a Storage (OBLIGATORIO - si falla, no continuar)
        let storageUploadSuccess = false;
        for (let attempt = 1; attempt <= 2; attempt++) {
            const { error: uploadError } = await supabaseAdmin.storage
                .from('knowledge-files')
                .upload(storagePath, buffer, {
                    contentType: file.type,
                    upsert: true
                });

            if (!uploadError) {
                console.log(`✅ Archivo subido a Storage exitosamente (intento ${attempt})`);
                storageUploadSuccess = true;
                break;
            }

            console.error(`⚠️ Error subiendo a Storage (intento ${attempt}/2):`, uploadError);
            if (attempt < 2) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        if (!storageUploadSuccess) {
            storagePath = null; // No se subió, no hay que limpiar
            return NextResponse.json({
                error: "No se pudo subir el archivo a Storage. Por favor intenta de nuevo. Si el problema persiste, verifica que el bucket 'knowledge-files' exista en Supabase."
            }, { status: 500 });
        }

        // 2. Extraer Texto según el tipo de archivo
        if (file.type === "application/pdf") {
            try {
                // Intentar extracción directa primero (rápido, gratis)
                textContent = await extractPdfText(buffer);
                console.log(`📄 unpdf extrajo ${textContent.length} caracteres`);

                // Si unpdf no extrajo suficiente texto, usar OpenAI Vision como fallback
                if (textContent.replace(/\s+/g, " ").trim().length < 50) {
                    console.log(`⚠️ Texto insuficiente con unpdf, usando OpenAI Vision...`);
                    textContent = await extractPdfWithOpenAI(buffer, file.name);
                    console.log(`🤖 OpenAI extrajo ${textContent.length} caracteres`);
                }
            } catch (pdfError: any) {
                console.error("❌ PDF Parse Error, intentando OpenAI fallback:", pdfError);
                try {
                    textContent = await extractPdfWithOpenAI(buffer, file.name);
                } catch (aiError: any) {
                    console.error("❌ OpenAI fallback también falló:", aiError);
                    throw new Error(`No se pudo extraer texto del PDF: ${pdfError.message}`);
                }
            }
        } else if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            const result = await mammoth.extractRawText({ buffer });
            textContent = result.value;
        } else if (file.type === "text/plain" || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            textContent = buffer.toString("utf-8");
        } else {
            // Rollback: limpiar Storage si ya se subió
            await supabaseAdmin.storage.from('knowledge-files').remove([storagePath]);
            storagePath = null;
            return NextResponse.json({ error: "Formato no soportado. Usa PDF, DOCX, TXT o MD." }, { status: 400 });
        }

        // Limpieza básica
        textContent = textContent.replace(/\s+/g, " ").trim();

        if (!textContent || textContent.length < 50) {
            // Rollback: texto insuficiente, limpiar Storage
            await supabaseAdmin.storage.from('knowledge-files').remove([storagePath]);
            storagePath = null;
            return NextResponse.json({ error: "El archivo está vacío o no tiene texto legible. Si es un PDF escaneado (imagen), conviértelo a texto primero." }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            text: textContent,
            storagePath: storagePath,
            metadata: {
                name: file.name,
                type: file.type,
                size: file.size
            }
        });

    } catch (error: any) {
        console.error("❌ Error en extracción:", error);
        // Rollback: limpiar Storage si se subió pero falló la extracción
        if (storagePath && supabaseAdmin) {
            try {
                console.warn('🔄 Rollback: limpiando archivo huérfano de Storage...');
                await supabaseAdmin.storage.from('knowledge-files').remove([storagePath]);
                console.log('✅ Storage limpiado tras error de extracción');
            } catch (cleanupError) {
                console.error('⚠️ Error limpiando Storage:', cleanupError);
            }
        }
        return NextResponse.json({ error: error.message || "Error procesando el archivo" }, { status: 500 });
    }
}
