"use client";

import { useState, useEffect } from "react";
import AppSidebar from "@/components/app-sidebar";
import { Activity, RefreshCw } from "lucide-react";
import { PilarCardSkeleton } from "@/components/ui/skeleton";

interface Pilar {
    id: number;
    nombre: string;
    status: string | null;
}

const STATUS_OPTIONS = [
    { value: "verde", label: "Verde — Operativo", emoji: "🟢", color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400", dot: "bg-emerald-400" },
    { value: "amarillo", label: "Amarillo — Atención", emoji: "🟡", color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400", dot: "bg-yellow-400" },
    { value: "naranja", label: "Naranja — Alerta", emoji: "🟠", color: "bg-orange-500/20 border-orange-500/40 text-orange-400", dot: "bg-orange-400" },
    { value: "rojo", label: "Rojo — Crítico", emoji: "🔴", color: "bg-red-500/20 border-red-500/40 text-red-400", dot: "bg-red-400" },
];

function getStatusConfig(status: string | null) {
    return STATUS_OPTIONS.find(s => s.value === status) || {
        value: "sin_definir", label: "Sin definir", emoji: "⚪", color: "bg-slate-500/20 border-slate-500/40 text-slate-400", dot: "bg-slate-400"
    };
}

export default function PilaresSemaphore() {
    const [pilares, setPilares] = useState<Pilar[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<number | null>(null);
    const [error, setError] = useState("");

    const loadPilares = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/pilares-status");
            if (!res.ok) throw new Error("Error cargando pilares");
            const data = await res.json();
            setPilares(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPilares(); }, []);

    const updateStatus = async (pilarId: number, newStatus: string) => {
        setUpdating(pilarId);
        try {
            const res = await fetch("/api/admin/pilares-status", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pilar_id: pilarId, status: newStatus }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Error actualizando");
            }
            const updated = await res.json();
            setPilares(prev => prev.map(p => p.id === updated.id ? updated : p));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans">
            {/* Background */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/5 rounded-full blur-[150px] pointer-events-none" />

            <AppSidebar />

            <div className="md:pl-[68px] relative z-10 min-h-screen flex flex-col pt-14 md:pt-0">
                {/* Header */}
                <div className="pt-10 pb-6 px-6 md:px-10 max-w-5xl mx-auto w-full">
                    <div className="flex items-center gap-3 mb-1">
                        <Activity className="w-6 h-6 text-[#00E599]" />
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            Semáforo de <span className="text-[#00E599]">Pilares</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Estado operativo de cada pilar del ecosistema. Haz clic en un color para cambiar el estado.
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 md:px-10 max-w-5xl mx-auto w-full flex-1">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                            <PilarCardSkeleton />
                            <PilarCardSkeleton />
                            <PilarCardSkeleton />
                            <PilarCardSkeleton />
                            <PilarCardSkeleton />
                            <PilarCardSkeleton />
                        </div>
                    ) : (
                        <>
                            {/* Overview bar */}
                            <div className="flex items-center gap-3 mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <span className="text-sm text-slate-400 font-medium mr-auto">Resumen:</span>
                                {STATUS_OPTIONS.map(opt => {
                                    const count = pilares.filter(p => p.status === opt.value).length;
                                    return (
                                        <div key={opt.value} className="flex items-center gap-1.5">
                                            <span className="text-base">{opt.emoji}</span>
                                            <span className="text-sm font-bold text-white">{count}</span>
                                        </div>
                                    );
                                })}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-base">⚪</span>
                                    <span className="text-sm font-bold text-white">
                                        {pilares.filter(p => !p.status || !STATUS_OPTIONS.some(s => s.value === p.status)).length}
                                    </span>
                                </div>
                                <button
                                    onClick={loadPilares}
                                    className="ml-2 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                    title="Recargar"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Pilar cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                                {pilares.map(pilar => {
                                    const cfg = getStatusConfig(pilar.status);
                                    const isUpdating = updating === pilar.id;

                                    return (
                                        <div
                                            key={pilar.id}
                                            className={`relative p-5 rounded-2xl border transition-all ${cfg.color}`}
                                        >
                                            {isUpdating && (
                                                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center z-10">
                                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}

                                            {/* Header */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-4 h-4 rounded-full ${cfg.dot} shadow-lg`} />
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-xs font-mono text-slate-500">P{pilar.id}</span>
                                                    <h3 className="text-sm font-bold text-white truncate">{pilar.nombre}</h3>
                                                </div>
                                            </div>

                                            {/* Current status */}
                                            <div className="mb-3">
                                                <p className="text-xs font-medium uppercase tracking-wider opacity-80">
                                                    {cfg.emoji} {cfg.label}
                                                </p>
                                            </div>

                                            {/* Status selector */}
                                            <div className="flex gap-2">
                                                {STATUS_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => updateStatus(pilar.id, opt.value)}
                                                        disabled={isUpdating || pilar.status === opt.value}
                                                        className={`flex-1 py-1.5 rounded-lg text-center text-xs font-medium transition-all ${pilar.status === opt.value
                                                            ? "ring-2 ring-white/30 scale-105"
                                                            : "hover:scale-105 opacity-60 hover:opacity-100"
                                                            } ${opt.color}`}
                                                        title={opt.label}
                                                    >
                                                        {opt.emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="mb-10 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Leyenda</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {STATUS_OPTIONS.map(opt => (
                                        <div key={opt.value} className="flex items-center gap-2">
                                            <span>{opt.emoji}</span>
                                            <span className="text-xs text-slate-300">{opt.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
