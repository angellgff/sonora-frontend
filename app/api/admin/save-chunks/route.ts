import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error("❌ CONFIG ERROR: Faltan variables de entorno de Supabase.");
    }
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

function getOpenAI() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { chunks, fileName, fileType, storagePath, startIndex } = body;

        if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
            return NextResponse.json({ error: "No se recibieron chunks válidos" }, { status: 400 });
        }

        console.log(`⚡ Procesando lote de ${chunks.length} chunks (Inicio: ${startIndex})...`);

        const supabaseAdmin = getSupabaseAdmin();
        const openai = getOpenAI();

        // 1. Generar Embeddings en lote
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: chunks,
        });

        const embeddings = embeddingResponse.data.map(e => e.embedding);

        // 2. Insertar en paralelo a Supabase
        const insertPromises = chunks.map((chunk: string, idx: number) => {
            const embedding = embeddings[idx];
            const globalIndex = startIndex + idx;

            // Metadata simplificada para ahorrar espacio, el total_chunks real se calculará al finalizar todo
            const metadata = {
                original_file: fileName,
                storage_path: storagePath,
                batch_index: idx
            };

            return supabaseAdmin.rpc("insert_knowledge_chunk", {
                p_document_name: fileName,
                p_document_type: fileType,
                p_chunk_text: chunk,
                p_chunk_index: globalIndex,
                p_embedding: embedding,
                p_metadata: metadata
            });
        });

        const results = await Promise.all(insertPromises);

        const failed = results.find((r: any) => r.error);
        if (failed) throw failed.error;

        return NextResponse.json({
            success: true,
            processed: chunks.length
        });

    } catch (error: any) {
        console.error("❌ Error guardando lote:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
