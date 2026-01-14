import Link from "next/link";
import { MessageSquare, User, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function UserDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let role = 'user';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile) role = profile.role;
  }

  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans selection:bg-[#00E599] selection:text-black flex flex-col items-center justify-center relative overflow-hidden">

      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 text-center space-y-8 p-6 max-w-2xl">
        <div className="mx-auto w-24 h-24 rounded-full bg-slate-800 border-2 border-[#00E599] flex items-center justify-center shadow-[0_0_30px_rgba(0,229,153,0.3)]">
          <User className="w-10 h-10 text-[#00E599]" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Bienvenido a <span className="text-[#00E599]">Sonora</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Tu asistente de inteligencia artificial avanzado.
          <br />¿Qué te gustaría hacer hoy?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Opción 1: Ir al Chat */}
          <Link href="/home-test" className="group relative p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:-translate-y-1">
            <div className="absolute top-4 right-4 text-[#00E599] opacity-50"><MessageSquare /></div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00E599]">Iniciar Conversación</h3>
            <p className="text-slate-400 text-sm">Habla con Sonora sobre cualquier documento o tema.</p>
          </Link>

          {/* Opción 2: Perfil (Placeholder) */}
          {/* Opción 2: Perfil */}
          <Link href="/profile" className="group relative p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:-translate-y-1">
            <div className="absolute top-4 right-4 text-[#00E599] opacity-50"><User /></div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00E599]">Mi Perfil</h3>
            <p className="text-slate-400 text-sm">Gestiona tu identidad y configuraciones.</p>
          </Link>
        </div>

        {/* Solo visible si fueras admin (Render Condicional Real) */}
        {isAdmin && (
          <div className="mt-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 space-y-3">
            <p className="text-xs text-slate-500 text-center mb-2">Panel de Administración</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/admin/users" className="text-xs text-slate-400 hover:text-[#00E599] flex items-center gap-2 transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:border-[#00E599]/30">
                <User className="w-3 h-3" /> Gestión de Usuarios
              </Link>
              <Link href="/admin/knowledge" className="text-xs text-slate-400 hover:text-[#00E599] flex items-center gap-2 transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:border-[#00E599]/30">
                <Shield className="w-3 h-3" /> Base de Conocimiento
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}