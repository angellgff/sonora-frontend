import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Cliente admin para crear usuarios (usa service_role key)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar que el usuario actual es admin
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        // Verificar rol admin (Pilar 1)
        const { data: profile } = await supabase
            .from("profiles")
            .select("pilar_id")
            .eq("id", user.id)
            .single();

        if (profile?.pilar_id !== 1) {
            return NextResponse.json(
                { error: "Solo los administradores (Pilar 1) pueden crear usuarios" },
                { status: 403 }
            );
        }

        // 2. Obtener datos del body
        const body = await request.json();
        const { email, password, fullName, pilarId } = body;

        // Validaciones
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email y contraseña son requeridos" },
                { status: 400 }
            );
        }

        if (!pilarId || pilarId < 1 || pilarId > 6) {
            return NextResponse.json(
                { error: "Pilar obligatorio e inválido. Debe ser entre 1 y 6" },
                { status: 400 }
            );
        }

        // 3. Crear usuario con Supabase Admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Confirmar email automáticamente
            user_metadata: {
                full_name: fullName || "",
            },
        });

        if (createError) {
            console.error("Error creando usuario:", createError);
            return NextResponse.json(
                { error: createError.message },
                { status: 400 }
            );
        }

        // 4. Actualizar perfil (asignar pilar)
        const profileUpdate: Record<string, any> = { pilar_id: pilarId };

        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update(profileUpdate)
            .eq("id", newUser.user.id);

        if (profileError) {
            console.error("Error actualizando perfil:", profileError);
            return NextResponse.json(
                { error: "Usuario creado pero no se pudo asignar el pilar" },
                { status: 500 }
            );
        }

        // 5. Retornar éxito
        return NextResponse.json({
            success: true,
            message: "Usuario creado exitosamente",
            user: {
                id: newUser.user.id,
                email: newUser.user.email,
                pilar_id: pilarId,
            },
        });

    } catch (error) {
        console.error("Error en create-user:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
