import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getTuGuiaAdmin() {
    const serviceRoleKey = process.env.TUGUIA_SERVICE_ROLE_KEY || process.env.TUGUIA_SUPABASE_SERVICE_KEY;
    const url = process.env.NEXT_PUBLIC_TUGUIA_URL;

    if (!serviceRoleKey || !url) {
        throw new Error("CONFIG ERROR: Faltan variables de entorno de Tu Guía.");
    }

    return createClient(url, serviceRoleKey);
}

export async function GET() {
    try {
        const supabase = getTuGuiaAdmin();
        const now = new Date();
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [
            totalProfilesRes,
            activeSubsRes,
            inactiveSubsRes,
            personalAccountsRes,
            businessAccountsRes,
            verifiedProfilesRes,
            notVerifiedProfilesRes,
            signups7dRes,
            signups30dRes,
            servicesRes,
            addressesRes,
        ] = await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_status", "active"),
            supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_status", "inactive"),
            supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "personal"),
            supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "business"),
            supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verified", true),
            supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verified", false),
            supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", last7d),
            supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", last30d),
            supabase.from("services").select("id", { count: "exact", head: true }),
            supabase.from("addresses").select("province"),
        ]);

        const queryErrors = [
            totalProfilesRes.error,
            activeSubsRes.error,
            inactiveSubsRes.error,
            personalAccountsRes.error,
            businessAccountsRes.error,
            verifiedProfilesRes.error,
            notVerifiedProfilesRes.error,
            signups7dRes.error,
            signups30dRes.error,
            servicesRes.error,
            addressesRes.error,
        ].filter(Boolean);

        if (queryErrors.length > 0) {
            throw queryErrors[0];
        }

        const provinceCounts = new Map<string, number>();
        for (const item of addressesRes.data || []) {
            const province = item.province;
            if (!province) continue;
            provinceCounts.set(province, (provinceCounts.get(province) || 0) + 1);
        }

        const topProvinces = Array.from(provinceCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([province, count]) => ({ province, count }));

        // === ADHERIDOS (role = member) ===
        const totalAdheridosRes = await supabase
            .from("profiles").select("id", { count: "exact", head: true }).eq("role", "member");

        if (totalAdheridosRes.error) throw totalAdheridosRes.error;

        // Get member IDs for cross-queries
        const membersRes = await supabase
            .from("profiles").select("id").eq("role", "member");

        const memberIds = (membersRes.data || []).map((m: any) => m.id);

        // Adheridos por rubro (subcategoria)
        let adheridosPorRubro: { rubro: string; count: number }[] = [];
        if (memberIds.length > 0) {
            const psRes = await supabase
                .from("profile_subcategories")
                .select("profile_id, subcategories(name)")
                .in("profile_id", memberIds);

            if (psRes.data) {
                const rubroCounts = new Map<string, number>();
                for (const row of psRes.data) {
                    const sub = (row as any).subcategories;
                    const name = sub?.name;
                    if (!name) continue;
                    rubroCounts.set(name, (rubroCounts.get(name) || 0) + 1);
                }
                adheridosPorRubro = Array.from(rubroCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([rubro, count]) => ({ rubro, count }));
            }
        }

        // Adheridos por provincia
        let adheridosPorProvincia: { provincia: string; count: number }[] = [];
        if (memberIds.length > 0) {
            const addrMembersRes = await supabase
                .from("addresses")
                .select("user_id, province")
                .in("user_id", memberIds);

            if (addrMembersRes.data) {
                const provCounts = new Map<string, number>();
                for (const row of addrMembersRes.data) {
                    const prov = row.province;
                    if (!prov) continue;
                    provCounts.set(prov, (provCounts.get(prov) || 0) + 1);
                }
                adheridosPorProvincia = Array.from(provCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([provincia, count]) => ({ provincia, count }));
            }
        }

        return NextResponse.json({
            totalProfiles: totalProfilesRes.count || 0,
            subscriptions: {
                active: activeSubsRes.count || 0,
                inactive: inactiveSubsRes.count || 0,
            },
            accountTypes: {
                personal: personalAccountsRes.count || 0,
                business: businessAccountsRes.count || 0,
            },
            verification: {
                verified: verifiedProfilesRes.count || 0,
                notVerified: notVerifiedProfilesRes.count || 0,
            },
            signups: {
                last7d: signups7dRes.count || 0,
                last30d: signups30dRes.count || 0,
            },
            totalServices: servicesRes.count || 0,
            topProvinces,
            adheridos: {
                total: totalAdheridosRes.count || 0,
                porRubro: adheridosPorRubro,
                porProvincia: adheridosPorProvincia,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
