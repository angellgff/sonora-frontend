import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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

function getOpenAI() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Función para generar metadata enriquecida con IA
async function enrichChunkMetadata(openai: OpenAI, chunk: string, fileName: string): Promise<{ summary: string; keywords: string[] }> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Eres un asistente que analiza fragmentos de documentos. Para cada fragmento, genera:
1. Un resumen de 1-2 oraciones que capture la idea principal
2. 3-5 palabras clave relevantes (en español)

Responde SOLO en formato JSON: {"summary": "...", "keywords": ["...", "..."]}`
                },
                {
                    role: "user",
                    content: `Archivo: ${fileName}\n\nFragmento:\n${chunk.substring(0, 1500)}...` // Limitar para no exceder tokens
                }
            ],
            max_tokens: 200,
            temperature: 0.3
        });

        const content = response.choices[0]?.message?.content || '{}';
        // Limpiar posibles artefactos de markdown
        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanContent);

        return {
            summary: parsed.summary || "Sin resumen disponible",
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
        };
    } catch (error) {
        console.warn("⚠️ Error generando metadata enriquecida:", error);
        return { summary: "Sin resumen", keywords: [] };
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { chunks, fileName, fileType, storagePath, startIndex, pilarId } = body;

        if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
            return NextResponse.json({ error: "No se recibieron chunks válidos" }, { status: 400 });
        }

        console.log(`⚡ Procesando lote de ${chunks.length} chunks (Inicio: ${startIndex})...`);

        let supabaseAdmin;
        try {
            supabaseAdmin = getSupabaseAdmin();
        } catch (initError: any) {
            return NextResponse.json({ error: "Error de configuración de BD en el servidor. Revisa las variables de entorno." }, { status: 500 });
        }
        
        const openai = getOpenAI();

        // 1. Generar Embeddings en lote
        console.log("🤖 Solicitando Embeddings a OpenAI...");
        const embeddingStart = Date.now();

        const embeddingResponse = await Promise.race([
            openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunks,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout conectando con OpenAI (15s)")), 15000))
        ]) as any;

        console.log(`✅ Embeddings recibidos en ${Date.now() - embeddingStart}ms`);

        const embeddings = embeddingResponse.data.map((e: any) => e.embedding);

        // 2. Generar metadata enriquecida para cada chunk (en paralelo, pero limitado)
        console.log("🧠 Generando metadata enriquecida con IA...");
        const metadataStart = Date.now();

        // Procesar en batches de 5 para no saturar la API
        const enrichedMetadata: Array<{ summary: string; keywords: string[] }> = [];
        const ENRICH_BATCH_SIZE = 5;

        for (let i = 0; i < chunks.length; i += ENRICH_BATCH_SIZE) {
            const batch = chunks.slice(i, i + ENRICH_BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map((chunk: string) => enrichChunkMetadata(openai, chunk, fileName))
            );
            enrichedMetadata.push(...batchResults);
        }

        console.log(`✅ Metadata enriquecida en ${Date.now() - metadataStart}ms`);

        // 3. Insertar en paralelo a Supabase pero por pequeños baches
        console.log("🗄️ Insertando en Supabase...");
        const dbStart = Date.now();
        const INSERT_BATCH_SIZE = 10;

        for (let i = 0; i < chunks.length; i += INSERT_BATCH_SIZE) {
            const batchChunks = chunks.slice(i, i + INSERT_BATCH_SIZE);
            
            const insertPromises = batchChunks.map((chunk: string, batchIdx: number) => {
                const idx = i + batchIdx;
                const embedding = embeddings[idx];
                const globalIndex = startIndex + idx;
                const enriched = enrichedMetadata[idx] || { summary: "", keywords: [] };

                const metadata = {
                    original_file: fileName,
                    storage_path: storagePath,
                    batch_index: idx,
                    summary: enriched.summary,
                    keywords: enriched.keywords
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
        }

        console.log(`✅ Supabase insert completado en ${Date.now() - dbStart}ms`);

        // 4. Si se indicó pilarId, actualizar los chunks recién insertados
        if (pilarId && pilarId >= 1 && pilarId <= 6) {
            console.log(`🏛️ Asignando pilar_id=${pilarId} a chunks de "${fileName}"...`);
            const { error: updateError } = await supabaseAdmin
                .from('knowledge_base')
                .update({ pilar_id: pilarId })
                .eq('document_name', fileName)
                .is('pilar_id', null);
            if (updateError) {
                console.warn('⚠️ Error asignando pilar_id:', updateError.message);
            } else {
                console.log(`✅ pilar_id=${pilarId} asignado correctamente`);
            }
        }

        return NextResponse.json({
            success: true,
            processed: chunks.length
        });

    } catch (error: any) {
        console.error("❌ Error guardando lote:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
