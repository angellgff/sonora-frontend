import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050B14] font-sans text-slate-200 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-6 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Algo salió mal
          </h1>
          <p className="text-slate-400 mb-8">
            No pudimos completar tu solicitud.
          </p>

          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl mb-8">
            <p className="text-sm text-red-300 font-mono break-all">
              {params?.error ? params.error : "Ocurrió un error desconocido."}
            </p>
          </div>

          <Link
            href="/auth/login"
            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-slate-900 bg-white hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all hover:-translate-y-0.5"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
