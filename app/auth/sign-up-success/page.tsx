import { Bot, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050B14] font-sans text-slate-200 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00E599]/10 border border-[#00E599]/20 mb-6 shadow-[0_0_15px_rgba(0,229,153,0.1)]">
            <CheckCircle2 className="w-8 h-8 text-[#00E599]" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            ¡Registro Exitoso!
          </h1>
          <p className="text-slate-400 mb-8">
            Gracias por unirte a Sonora.
          </p>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-8">
            <p className="text-sm text-slate-300">
              Hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada y sigue el enlace para activar tu cuenta.
            </p>
          </div>

          <Link
            href="/auth/login"
            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-slate-900 bg-[#00E599] hover:bg-[#00E599]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E599] shadow-[0_0_20px_rgba(0,229,153,0.2)] hover:shadow-[0_0_30px_rgba(0,229,153,0.4)] transition-all hover:-translate-y-0.5"
          >
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
