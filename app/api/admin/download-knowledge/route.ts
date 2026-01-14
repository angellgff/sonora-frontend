import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET(req: NextRequest) {
    const supabaseAdmin = getSupabaseAdmin();

    try {
        const { searchParams } = new URL(req.url);
        const filename = searchParams.get("filename");

        if (!filename) {
            return NextResponse.json({ error: "Falta el nombre del archivo" }, { status: 400 });
        }

        const { data: chunkData, error: queryError } = await supabaseAdmin.from('knowledge_base').select('metadata').eq('document_name', filename).limit(1).single();

        if (queryError || !chunkData) {
            return NextResponse.json({ error: "Archivo no encontrado en la base de datos" }, { status: 404 });
        }

        const storagePath = chunkData.metadata?.storage_path;

        if (!storagePath) {
            return NextResponse.json({
                error: "Este archivo fue subido antes de habilitar la descarga. No tiene archivo original guardado."
            }, { status: 404 });
        }

        const { data: fileData, error: downloadError } = await supabaseAdmin.storage.from('knowledge-files').download(storagePath);

        if (downloadError || !fileData) {
            console.error("Error descargando:", downloadError);
            return NextResponse.json({ error: "Error al descargar el archivo" }, { status: 500 });
        }

        const extension = filename.split('.').pop()?.toLocaleLowerCase();
        let contentType = 'application/octet-stream';
        if (extension === 'pdf') contentType = 'application/pdf';
        else if (extension === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (extension === 'txt') contentType = 'text/plain';

        const arrayBuffer = await fileData.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
                'content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        console.error("Error en descarga:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}