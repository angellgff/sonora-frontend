import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error("❌ CONFIG ERROR: Faltan variables de entorno de Supabase.");
    }
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey
    );
}

// GET: Obtener todos los pilares con su status
export async function GET() {
    try {
        const { data, error } = await getSupabaseAdmin()
            .from("pilares")
            .select("id, nombre, status")
            .order("id");

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Actualizar status de un pilar
export async function PATCH(request: Request) {
    try {
        const { pilar_id, status } = await request.json();

        if (!pilar_id || !status) {
            return NextResponse.json({ error: "pilar_id y status son requeridos" }, { status: 400 });
        }

        const validStatuses = ["verde", "amarillo", "naranja", "rojo"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: `Status inválido. Debe ser: ${validStatuses.join(", ")}` }, { status: 400 });
        }

        const { data, error } = await getSupabaseAdmin()
            .from("pilares")
            .update({ status })
            .eq("id", pilar_id)
            .select("id, nombre, status")
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
