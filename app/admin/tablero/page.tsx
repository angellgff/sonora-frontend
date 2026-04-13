"use client";

import { useState, useEffect } from "react";
import AppSidebar from "@/components/app-sidebar";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import {
    Activity,
    Users,
    MessageSquare,
    BookOpen,
    Shield,
    TrendingUp,
    AlertTriangle,
    RefreshCw,
    Zap,
    BarChart3,
} from "lucide-react";

interface PilarData {
    id: number;
    nombre: string;
    status: string | null;
}

interface DashboardData {
    pilares: PilarData[];
    globalHealth: number;
    activeAlerts: PilarData[];
    stats: {
        totalUsers: number;
        conversations24h: number;
        conversations7d: number;
        totalConversations: number;
        messages24h: number;
        kbFiles: number;
    };
    pilarUserCounts: Record<number, number>;
}

interface TuGuiaMetrics {
    totalProfiles: number;
    subscriptions: {
        active: number;
        inactive: number;
    };
    accountTypes: {
        personal: number;
        business: number;
    };
    verification: {
        verified: number;
        notVerified: number;
    };
    signups: {
        last7d: number;
        last30d: number;
    };
    totalServices: number;
    topProvinces: Array<{
        province: string;
        count: number;
    }>;
    adheridos: {
        total: number;
        porRubro: Array<{ rubro: string; count: number }>;
        porProvincia: Array<{ provincia: string; count: number }>;
    };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; glow: string; dot: string }> = {
    verde: { label: "Operativo", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]", dot: "bg-emerald-400" },
    amarillo: { label: "Atención", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", glow: "shadow-[0_0_20px_rgba(234,179,8,0.15)]", dot: "bg-yellow-400" },
    naranja: { label: "Alerta", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", glow: "shadow-[0_0_20px_rgba(249,115,22,0.15)]", dot: "bg-orange-400" },
    rojo: { label: "Crítico", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", glow: "shadow-[0_0_20px_rgba(239,68,68,0.2)]", dot: "bg-red-400" },
};

function getStatusConfig(status: string | null) {
    if (!status || !STATUS_CONFIG[status]) {
        return { label: "Sin definir", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", glow: "", dot: "bg-slate-400" };
    }
    return STATUS_CONFIG[status];
}

function getHealthColor(score: number) {
    if (score >= 8) return { color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30", label: "Saludable" };
    if (score >= 6) return { color: "text-yellow-400", bg: "from-yellow-500/20 to-yellow-500/5", border: "border-yellow-500/30", label: "Atención" };
    if (score >= 4) return { color: "text-orange-400", bg: "from-orange-500/20 to-orange-500/5", border: "border-orange-500/30", label: "Riesgo" };
    return { color: "text-red-400", bg: "from-red-500/20 to-red-500/5", border: "border-red-500/30", label: "Crítico" };
}

export default function TableroFundador() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [tuGuiaMetrics, setTuGuiaMetrics] = useState<TuGuiaMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [tableroRes, tuguiaRes] = await Promise.all([
                fetch("/api/admin/tablero"),
                fetch("/api/admin/tuguia-metrics"),
            ]);

            if (!tableroRes.ok) throw new Error("Error cargando datos del tablero");
            if (!tuguiaRes.ok) throw new Error("Error cargando métricas de Tu Guía");

            const tableroJson = await tableroRes.json();
            const tuguiaJson = await tuguiaRes.json();

            setData(tableroJson);
            setTuGuiaMetrics(tuguiaJson);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const healthConfig = data ? getHealthColor(data.globalHealth) : getHealthColor(0);

    return (
        <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans">
            {/* Background ambience */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/5 rounded-full blur-[150px] pointer-events-none" />

            <AppSidebar />

            <div className="md:pl-[68px] relative z-10 min-h-screen flex flex-col pt-14 md:pt-0">
                {/* Header */}
                <div className="px-6 md:px-10 py-8 border-b border-white/5">
                    <div className="max-w-7xl mx-auto">
                    <Breadcrumbs items={[{ label: "Admin" }, { label: "Tablero del Fundador" }]} />
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-[#00E599]" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tablero del Fundador</h1>
                            </div>
                            <p className="text-slate-400 text-sm md:text-base">Visualización estratégica del ecosistema — Pilar 1</p>
                        </div>
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 hover:border-[#00E599]/30 transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Actualizar
                        </button>
                    </div>
                    </div>
                </div>

                {error && (
                    <div className="mx-6 md:mx-10 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm max-w-7xl mx-auto">
                        {error}
                    </div>
                )}

                {loading && !data ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex items-center gap-3 text-slate-400">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Cargando datos del ecosistema...</span>
                        </div>
                    </div>
                ) : data && (
                    <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto w-full space-y-8">

                        {/* === ROW 1: Health Index + Active Alerts === */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Health Index (big card) */}
                            <div className={`lg:col-span-1 rounded-2xl border ${healthConfig.border} bg-gradient-to-br ${healthConfig.bg} backdrop-blur-xl p-6 relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className={`w-5 h-5 ${healthConfig.color}`} />
                                        <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Salud Global</span>
                                    </div>
                                    <div className="flex items-end gap-3 mb-2">
                                        <span className={`text-5xl font-black ${healthConfig.color}`}>{data.globalHealth}</span>
                                        <span className="text-slate-500 text-lg font-light mb-1">/ 10</span>
                                    </div>
                                    <p className={`text-sm font-medium ${healthConfig.color}`}>{healthConfig.label}</p>

                                    {/* Health bar */}
                                    <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                data.globalHealth >= 8 ? "bg-emerald-400" :
                                                data.globalHealth >= 6 ? "bg-yellow-400" :
                                                data.globalHealth >= 4 ? "bg-orange-400" : "bg-red-400"
                                            }`}
                                            style={{ width: `${(data.globalHealth / 10) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Active Alerts */}
                            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Alertas Activas</span>
                                </div>

                                {data.activeAlerts.length === 0 ? (
                                    <div className="flex items-center gap-3 py-6">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <Shield className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Sin alertas críticas</p>
                                            <p className="text-slate-500 text-sm">Todos los pilares operan con normalidad</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.activeAlerts.map((alert) => {
                                            const cfg = getStatusConfig(alert.status);
                                            return (
                                                <div key={alert.id} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                                                    <div className={`w-3 h-3 rounded-full ${cfg.dot} animate-pulse`} />
                                                    <div className="flex-1">
                                                        <p className={`font-semibold text-sm ${cfg.color}`}>
                                                            Pilar {alert.id} — {alert.nombre}
                                                        </p>
                                                        <p className="text-slate-500 text-xs">
                                                            Estado: {cfg.label} — {alert.status === "rojo" ? "Requiere intervención directa" : "Requiere revisión evaluativa"}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* === ROW 2: Pilar Semaphores === */}
                        <div>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-[#00E599]" />
                                Semáforo de Pilares
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {data.pilares.map((pilar) => {
                                    const cfg = getStatusConfig(pilar.status);
                                    const userCount = data.pilarUserCounts[pilar.id] || 0;
                                    return (
                                        <div key={pilar.id} className={`rounded-2xl border ${cfg.border} ${cfg.bg} backdrop-blur-xl p-4 text-center transition-all hover:scale-[1.02] ${cfg.glow}`}>
                                            <div className={`w-4 h-4 rounded-full ${cfg.dot} mx-auto mb-3 ${pilar.status === "rojo" || pilar.status === "naranja" ? "animate-pulse" : ""}`} />
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Pilar {pilar.id}</p>
                                            <p className="text-sm font-bold text-white truncate mb-1" title={pilar.nombre}>{pilar.nombre}</p>
                                            <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
                                            <div className="mt-3 pt-2 border-t border-white/5">
                                                <p className="text-[10px] text-slate-500 uppercase">Usuarios</p>
                                                <p className="text-lg font-bold text-white">{userCount}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* === ROW 3: Activity Stats === */}
                        <div>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#00E599]" />
                                Actividad del Ecosistema
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <StatCard
                                    icon={<Users className="w-5 h-5" />}
                                    label="Usuarios Totales"
                                    value={data.stats.totalUsers}
                                    color="text-blue-400"
                                    bg="bg-blue-500/10"
                                    border="border-blue-500/20"
                                />
                                <StatCard
                                    icon={<MessageSquare className="w-5 h-5" />}
                                    label="Conversaciones Hoy"
                                    value={data.stats.conversations24h}
                                    color="text-violet-400"
                                    bg="bg-violet-500/10"
                                    border="border-violet-500/20"
                                />
                                <StatCard
                                    icon={<MessageSquare className="w-5 h-5" />}
                                    label="Conversaciones 7D"
                                    value={data.stats.conversations7d}
                                    color="text-indigo-400"
                                    bg="bg-indigo-500/10"
                                    border="border-indigo-500/20"
                                />
                                <StatCard
                                    icon={<MessageSquare className="w-5 h-5" />}
                                    label="Conv. Total"
                                    value={data.stats.totalConversations}
                                    color="text-cyan-400"
                                    bg="bg-cyan-500/10"
                                    border="border-cyan-500/20"
                                />
                                <StatCard
                                    icon={<Zap className="w-5 h-5" />}
                                    label="Mensajes Hoy"
                                    value={data.stats.messages24h}
                                    color="text-amber-400"
                                    bg="bg-amber-500/10"
                                    border="border-amber-500/20"
                                />
                                <StatCard
                                    icon={<BookOpen className="w-5 h-5" />}
                                    label="Archivos KB"
                                    value={data.stats.kbFiles}
                                    color="text-emerald-400"
                                    bg="bg-emerald-500/10"
                                    border="border-emerald-500/20"
                                />
                            </div>
                        </div>

                        {tuGuiaMetrics && (
                            <div>
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#00E599]" />
                                    Tu Guía Argentina
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                                    <StatCard
                                        icon={<Users className="w-5 h-5" />}
                                        label="Perfiles"
                                        value={tuGuiaMetrics.totalProfiles}
                                        color="text-sky-400"
                                        bg="bg-sky-500/10"
                                        border="border-sky-500/20"
                                    />
                                    <StatCard
                                        icon={<TrendingUp className="w-5 h-5" />}
                                        label="Altas 7D"
                                        value={tuGuiaMetrics.signups.last7d}
                                        color="text-violet-400"
                                        bg="bg-violet-500/10"
                                        border="border-violet-500/20"
                                    />
                                    <StatCard
                                        icon={<TrendingUp className="w-5 h-5" />}
                                        label="Altas 30D"
                                        value={tuGuiaMetrics.signups.last30d}
                                        color="text-indigo-400"
                                        bg="bg-indigo-500/10"
                                        border="border-indigo-500/20"
                                    />
                                    <StatCard
                                        icon={<Shield className="w-5 h-5" />}
                                        label="Verificados"
                                        value={tuGuiaMetrics.verification.verified}
                                        color="text-emerald-400"
                                        bg="bg-emerald-500/10"
                                        border="border-emerald-500/20"
                                    />
                                    <StatCard
                                        icon={<Users className="w-5 h-5" />}
                                        label="Suscripciones Activas"
                                        value={tuGuiaMetrics.subscriptions.active}
                                        color="text-amber-400"
                                        bg="bg-amber-500/10"
                                        border="border-amber-500/20"
                                    />
                                    <StatCard
                                        icon={<BookOpen className="w-5 h-5" />}
                                        label="Servicios"
                                        value={tuGuiaMetrics.totalServices}
                                        color="text-cyan-400"
                                        bg="bg-cyan-500/10"
                                        border="border-cyan-500/20"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Distribución de cuentas</h3>
                                        <div className="space-y-4">
                                            <MetricRow label="Personales" value={tuGuiaMetrics.accountTypes.personal} total={tuGuiaMetrics.totalProfiles} color="bg-sky-400" />
                                            <MetricRow label="Business" value={tuGuiaMetrics.accountTypes.business} total={tuGuiaMetrics.totalProfiles} color="bg-violet-400" />
                                            <MetricRow label="No verificados" value={tuGuiaMetrics.verification.notVerified} total={tuGuiaMetrics.totalProfiles} color="bg-amber-400" />
                                            <MetricRow label="Suscripciones inactivas" value={tuGuiaMetrics.subscriptions.inactive} total={tuGuiaMetrics.totalProfiles} color="bg-rose-400" />
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Top provincias</h3>
                                        <div className="space-y-3">
                                            {tuGuiaMetrics.topProvinces.map((item) => (
                                                <div key={item.province} className="flex items-center gap-3">
                                                    <div className="w-40 text-sm text-white truncate">{item.province}</div>
                                                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#00E599] rounded-full"
                                                            style={{ width: `${tuGuiaMetrics.topProvinces[0]?.count ? (item.count / tuGuiaMetrics.topProvinces[0].count) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-10 text-right text-sm text-slate-300 font-semibold">{item.count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === ROW: Adheridos por Rubro y Provincia === */}
                        {tuGuiaMetrics?.adheridos && (
                            <div>
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-[#00E599]" />
                                    Adheridos Tu Guía
                                    <span className="text-sm font-normal text-slate-400 ml-2">({tuGuiaMetrics.adheridos.total} miembros)</span>
                                </h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Por Rubro */}
                                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Por Rubro</h3>
                                        <div className="space-y-3">
                                            {tuGuiaMetrics.adheridos.porRubro.length === 0 && (
                                                <p className="text-sm text-slate-500">Sin datos de rubros</p>
                                            )}
                                            {tuGuiaMetrics.adheridos.porRubro.map((item) => (
                                                <div key={item.rubro} className="flex items-center gap-3">
                                                    <div className="w-44 text-sm text-white truncate" title={item.rubro}>{item.rubro}</div>
                                                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-violet-400 rounded-full"
                                                            style={{ width: `${tuGuiaMetrics.adheridos.porRubro[0]?.count ? (item.count / tuGuiaMetrics.adheridos.porRubro[0].count) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-8 text-right text-sm text-slate-300 font-semibold">{item.count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Por Provincia */}
                                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Por Provincia</h3>
                                        <div className="space-y-3">
                                            {tuGuiaMetrics.adheridos.porProvincia.length === 0 && (
                                                <p className="text-sm text-slate-500">Sin datos de provincias</p>
                                            )}
                                            {tuGuiaMetrics.adheridos.porProvincia.map((item) => (
                                                <div key={item.provincia} className="flex items-center gap-3">
                                                    <div className="w-44 text-sm text-white truncate" title={item.provincia}>{item.provincia}</div>
                                                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#00E599] rounded-full"
                                                            style={{ width: `${tuGuiaMetrics.adheridos.porProvincia[0]?.count ? (item.count / tuGuiaMetrics.adheridos.porProvincia[0].count) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-8 text-right text-sm text-slate-300 font-semibold">{item.count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === ROW 4: Future Financial Indicators (Placeholders) === */}
                        <div>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-slate-500" />
                                <span className="text-slate-500">Indicadores Financieros</span>
                                <span className="text-[10px] bg-white/5 border border-white/10 text-slate-500 px-2 py-0.5 rounded-full uppercase font-semibold tracking-wider">Próximamente</span>
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {[
                                    "Ingreso Mensual",
                                    "Margen Neto",
                                    "Fondo de Reserva",
                                    "Crecimiento Neto",
                                    "Dep. Territorial",
                                ].map((label) => (
                                    <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 text-center opacity-50">
                                        <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2">{label}</p>
                                        <p className="text-2xl font-bold text-slate-600">—</p>
                                        <p className="text-[10px] text-slate-700 mt-1">Requiere datos de negocio</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer note */}
                        <div className="text-center py-6 border-t border-white/5">
                            <p className="text-xs text-slate-600">
                                Tablero del Fundador — Pilar 1 · Administración General · Ecosistema 14/11 S.A.S.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Stat card component
function StatCard({ icon, label, value, color, bg, border }: {
    icon: React.ReactNode; label: string; value: number; color: string; bg: string; border: string;
}) {
    return (
        <div className={`rounded-2xl border ${border} ${bg} backdrop-blur-xl p-5 text-center transition-all hover:scale-[1.02]`}>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-3 ${color}`}>
                {icon}
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{label}</p>
            <p className={`text-2xl font-bold text-white`}>{value}</p>
        </div>
    );
}

function MetricRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const width = total > 0 ? (value / total) * 100 : 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-300">{label}</span>
                <span className="text-sm font-semibold text-white">{value}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
            </div>
        </div>
    );
}
