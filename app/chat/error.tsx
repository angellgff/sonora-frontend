"use client";

import { useEffect } from "react";
import { MessageSquare, RefreshCw, Home } from "lucide-react";

export default function ChatError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Error en chat:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center px-6 font-sans">
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-md w-full text-center">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
                        <MessageSquare className="w-8 h-8 text-orange-400" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        Error en el chat
                    </h1>
                    <p className="text-slate-400 text-sm mb-6">
                        Hubo un problema cargando el chat. Tu historial de conversaciones está seguro.
                    </p>

                    {process.env.NODE_ENV === "development" && error?.message && (
                        <div className="mb-6 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-left">
                            <p className="text-xs text-orange-400 font-mono break-all">
                                {error.message}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.href = "/dashboard"}
                            className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Dashboard
                        </button>
                        <button
                            onClick={() => reset()}
                            className="flex-1 py-3 px-4 rounded-xl bg-[#00E599] text-slate-900 text-sm font-bold hover:bg-[#00E599]/90 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,153,0.2)]"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
