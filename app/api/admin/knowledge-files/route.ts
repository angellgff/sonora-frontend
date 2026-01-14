import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    );
}

// GET: Obtener lista de archivos (agrupados)
export async function GET() {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // Hacemos una consulta agrupada para ver ARCHIVOS únicos, no chunks sueltos
        const { data, error } = await supabaseAdmin
            .from('knowledge_base')
            .select('document_name, document_type, created_at');
            
        if (error) throw error;

        // Procesamos javascript para agrupar (más seguro si Supabase limita GROUP BY en API simple)
        const fileMap = new Map();

        data.forEach((row: any) => {
            if (!fileMap.has(row.document_name)) {
                fileMap.set(row.document_name, {
                    name: row.document_name,
                    type: row.document_type,
                    created_at: row.created_at,
                    chunks: 0
                });
            }
            fileMap.get(row.document_name).chunks++;
        });

        const files = Array.from(fileMap.values());
        
        return NextResponse.json({ files });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Borrar archivo completo (todos sus chunks)
export async function DELETE(req: NextRequest) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const { filename } = await req.json();

        if (!filename) {
            return NextResponse.json({ error: "Falta el nombre del archivo" }, { status: 400 });
        }

        const { data: chunkData} = await supabaseAdmin.from("knowledge_base").select("metadata").eq("document_name", filename).limit(1).single();

        const storagePath = chunkData?.metadata?.storage_path;

        const { error } = await supabaseAdmin
            .from("knowledge_base")
            .delete()
            .eq("document_name", filename);

        if (error) throw error;

        if (storagePath) {
            const {error: storageError} = await supabaseAdmin.storage.from("knowledge-files").remove([storagePath]);

            if (storageError) {
                console.warn("No se pudo borrar del Storage", storageError);
            }
        }

        return NextResponse.json({ success: true, message: `Archivo ${filename} eliminado.` });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}