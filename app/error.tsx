"use client";

import { useEffect } from "react";
import { Bot, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Error global:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center px-6 font-sans">
            {/* Background */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 max-w-md w-full text-center">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                        <Bot className="w-8 h-8 text-red-400" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        Algo salió mal
                    </h1>
                    <p className="text-slate-400 text-sm mb-6">
                        Ocurrió un error inesperado. Puedes intentar recargar la página o volver al inicio.
                    </p>

                    {/* Error details (dev only) */}
                    {process.env.NODE_ENV === "development" && error?.message && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
                            <p className="text-xs text-red-400 font-mono break-all">
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
                            Inicio
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
