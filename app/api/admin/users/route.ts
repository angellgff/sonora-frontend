import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Cliente admin para operaciones con usuarios (usa service_role key)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
    try {
        // 1. Verificar admin
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("pilar_id")
            .eq("id", user.id)
            .single();

        if (profile?.pilar_id !== 1) {
            return NextResponse.json({ error: "Solo los administradores pueden eliminar usuarios" }, { status: 403 });
        }

        // 2. Obtener el ID del query parameter
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Falta el ID del usuario" }, { status: 400 });
        }

        // 3. Eliminar usuario de Supabase Auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (deleteError) {
            console.error("Error eliminando usuario (Auth):", deleteError);
            return NextResponse.json({ error: "Error eliminando usuario de la base" }, { status: 500 });
        }

        // Nota: Si no hay trigger de cascade delete, eliminamos manualmente de profiles.
        // Si hay trigger, esto fallará silenciosamente (porque ya no existe) o no hará nada.
        await supabaseAdmin.from("profiles").delete().eq("id", id);

        return NextResponse.json({ success: true, message: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error("Error en DELETE /admin/users:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        // 1. Verificar admin
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("pilar_id")
            .eq("id", user.id)
            .single();

        if (profile?.pilar_id !== 1) {
            return NextResponse.json({ error: "Solo los administradores pueden editar usuarios" }, { status: 403 });
        }

        // 2. Obtener body
        const body = await request.json();
        const { id, pilarId } = body;

        if (!id || !pilarId || pilarId < 1 || pilarId > 6) {
            return NextResponse.json({ error: "ID y Pilar (1-6) válidos son requeridos" }, { status: 400 });
        }

        // 3. Actualizar perfil
        const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ pilar_id: pilarId })
            .eq("id", id);

        if (updateError) {
            console.error("Error editando pilar del usuario:", updateError);
            return NextResponse.json({ error: "No se pudo actualizar el pilar" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Pilar de usuario actualizado" });
    } catch (error) {
        console.error("Error en PUT /admin/users:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
