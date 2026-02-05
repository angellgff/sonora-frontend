import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdf from "pdf-parse"; // Import estático para prevenir error de test/data en Vercel
import mammoth from "mammoth";
import { getEncoding } from "js-tiktoken";

// Configuración para Vercel / Next.js
export const maxDuration = 60; // 60 segundos (límite Pro, o 10s en Hobby). Aumentar si es posible.
export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
    // Intentar obtener la key de servicio de varias formas segura (sin prefijo) o legacy (con prefijo)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        throw new Error("❌ CONFIG ERROR: Falta SUPABASE_SERVICE_ROLE_KEY en variables de entorno.");
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error("❌ CONFIG ERROR: Falta NEXT_PUBLIC_SUPABASE_URL en variables de entorno.");
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            }
        }
    );
}

function getOpenAI() {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

//const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
//});

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

// Función para dividir texto en chunks (fragmentos)
const chunkText = (text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) => {
    const enc = getEncoding("cl100k_base");
    const tokens = enc.encode(text);
    const chunks: string[] = [];
    let start = 0;
    while (start < tokens.length) {
        const end = start + chunkSize;
        const chunkTokens = tokens.slice(start, end);
        // Corrección: js-tiktoken devuelve string directo, borramos TextDecoder
        const chunkContent = enc.decode(chunkTokens);
        chunks.push(chunkContent);
        start = end - overlap;
    }
    // Corrección: js-tiktoken no necesita .free(), se limpia solo
    return chunks;
};

export async function POST(req: NextRequest) {
    // Variables para el rollback
    let storagePath: string | null = null;
    let chunksInserted: string[] = [];
    let fileName: string = "";

    // Cliente Supabase (puede ser null si falla inicialización)
    let supabaseAdmin: any = null;

    try {
        supabaseAdmin = getSupabaseAdmin();
        const openai = getOpenAI();

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
        }

        fileName = file.name;
        console.log(`📂 Procesando archivo: ${file.name} (${file.type})`);

        const buffer = Buffer.from(await file.arrayBuffer());
        let textContent = "";

        // 1. Extraer Texto según el tipo de archivo
        if (file.type === "application/pdf") {
            try {
                // Configuración básica para evitar features exóticas que causen crash
                const data = await pdf(buffer);
                textContent = data.text;
            } catch (pdfError: any) {
                console.error("❌ Critical PDF Parse Error:", pdfError);
                // Lanzamos error controlado que el catch principal transformará en JSON
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

        // Limpieza básica de espacios extra
        textContent = textContent.replace(/\s+/g, " ").trim();

        if (!textContent) {
            return NextResponse.json({ error: "El archivo está vacío o no tiene texto legible." }, { status: 400 });
        }

        // 2. Fragmentar el texto (Chunking)
        const chunks = chunkText(textContent);
        console.log(`🧩 Generados ${chunks.length} chunks.`);

        // 3. Preparar storage path (pero NO subir aún)
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        storagePath = `${timestamp}_${safeFileName}`;

        // 4. Generar Embeddings y Guardar en Supabase (PRIMERO)
        // Si esto falla (ej: sin VPN para OpenAI), NO se sube al Storage
        let processed = 0;

        // 4. Generar Embeddings y Guardar en Supabase (OPTIMIZADO: Batch Processing)
        const BATCH_SIZE = 50; // Aumentado a 50 para velocidad máxima (menos viajes HTTP)
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batchChunks = chunks.slice(i, i + BATCH_SIZE);
            console.log(`⚡ Procesando lote ${i / BATCH_SIZE + 1}...`);

            try {
                // OpenAI permite enviar array de inputs (mucho más rápido)
                const embeddingResponse = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: batchChunks,
                });

                const embeddings = embeddingResponse.data.map(e => e.embedding);

                // Insertar en paralelo a Supabase
                const insertPromises = batchChunks.map((chunk, idx) => {
                    const embedding = embeddings[idx];
                    const globalIndex = i + idx;

                    const metadata = {
                        total_chunks: chunks.length,
                        original_file: file.name,
                        storage_path: storagePath
                    };

                    return supabaseAdmin.rpc("insert_knowledge_chunk", {
                        p_document_name: file.name,
                        p_document_type: file.type,
                        p_chunk_text: chunk,
                        p_chunk_index: globalIndex,
                        p_embedding: embedding,
                        p_metadata: metadata
                    });
                });

                // Esperar a que se guarden todos los del lote
                const results = await Promise.all(insertPromises);

                // Verificar errores
                const failed = results.find(r => r.error);
                if (failed) throw failed.error;

                processed += batchChunks.length;
                chunksInserted.push(file.name);

            } catch (batchError) {
                console.error("❌ Error en lote:", batchError);
                throw batchError;
            }
        }

        console.log(`✅ ${processed} chunks guardados correctamente.`);

        // 5. SOLO si todos los chunks se guardaron, subir al Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from('knowledge-files')
            .upload(storagePath, file, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error("❌ Error subiendo a Storage:", uploadError);
            // Rollback: eliminar chunks que ya se insertaron
            await supabaseAdmin
                .from("knowledge_base")
                .delete()
                .eq("document_name", file.name);
            console.log("🔄 Rollback: chunks eliminados de knowledge_base");
            throw new Error(`Error al guardar archivo en Storage: ${uploadError.message}`);
        }

        console.log(`✅ Archivo guardado en Storage: ${storagePath}`);

        return NextResponse.json({
            success: true,
            chunks: processed,
            message: `Archivo "${file.name}" procesado correctamente.`
        });

    } catch (error: any) {
        console.error("❌ Error processing file:", error);

        // Rollback: si se insertaron chunks pero algo falló después
        if (supabaseAdmin && chunksInserted.length > 0 && fileName) {
            try {
                await supabaseAdmin
                    .from("knowledge_base")
                    .delete()
                    .eq("document_name", fileName);
                console.log("🔄 Rollback: chunks eliminados de knowledge_base");
            } catch (rollbackError) {
                console.error("⚠️ Error en rollback:", rollbackError);
            }
        }

        // Rollback: si se subió al storage pero algo falló después
        if (supabaseAdmin && storagePath) {
            try {
                await supabaseAdmin.storage
                    .from('knowledge-files')
                    .remove([storagePath]);
                console.log("🔄 Rollback: archivo eliminado de Storage");
            } catch (storageRollbackError) {
                console.error("⚠️ Error eliminando de Storage:", storageRollbackError);
            }
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}