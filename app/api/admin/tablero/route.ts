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

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Pilares con semáforo
        const { data: pilares } = await supabase
            .from("pilares")
            .select("id, nombre, status")
            .order("id");

        // 2. Contar usuarios totales
        const { count: totalUsers } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true });

        // 3. Contar conversaciones (últimas 24h, 7d, total)
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { count: conversations24h } = await supabase
            .from("conversations")
            .select("id", { count: "exact", head: true })
            .gte("created_at", last24h);

        const { count: conversations7d } = await supabase
            .from("conversations")
            .select("id", { count: "exact", head: true })
            .gte("created_at", last7d);

        const { count: totalConversations } = await supabase
            .from("conversations")
            .select("id", { count: "exact", head: true });

        // 4. Contar mensajes (últimas 24h)
        const { count: messages24h } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .gte("created_at", last24h);

        // 5. Contar archivos de Knowledge Base
        const { count: kbFiles } = await supabase
            .from("documents")
            .select("id", { count: "exact", head: true });

        // 6. Usuarios por pilar
        const { data: usersByPilar } = await supabase
            .from("profiles")
            .select("pilar_id");

        const pilarUserCounts: Record<number, number> = {};
        if (usersByPilar) {
            for (const u of usersByPilar) {
                if (u.pilar_id) {
                    pilarUserCounts[u.pilar_id] = (pilarUserCounts[u.pilar_id] || 0) + 1;
                }
            }
        }

        // 7. Calcular salud global (0–10) basada en semáforos
        const statusScores: Record<string, number> = {
            verde: 10,
            amarillo: 7,
            naranja: 4,
            rojo: 1,
        };
        let healthScore = 0;
        let scoredPilars = 0;
        if (pilares) {
            for (const p of pilares) {
                if (p.status && statusScores[p.status] !== undefined) {
                    healthScore += statusScores[p.status];
                    scoredPilars++;
                }
            }
        }
        const globalHealth = scoredPilars > 0 ? Math.round((healthScore / scoredPilars) * 10) / 10 : 0;

        // 8. Detectar alertas activas (pilares en naranja o rojo)
        const activeAlerts = pilares?.filter(p => p.status === "naranja" || p.status === "rojo") || [];

        return NextResponse.json({
            pilares: pilares || [],
            globalHealth,
            activeAlerts,
            stats: {
                totalUsers: totalUsers || 0,
                conversations24h: conversations24h || 0,
                conversations7d: conversations7d || 0,
                totalConversations: totalConversations || 0,
                messages24h: messages24h || 0,
                kbFiles: kbFiles || 0,
            },
            pilarUserCounts,
        });
    } catch (error: any) {
        console.error("Error en tablero:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
