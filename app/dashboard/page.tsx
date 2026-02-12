import AppSidebar from "@/components/app-sidebar";
import Link from "next/link";
import { MessageSquare, User, Shield, BookOpen, Users as UsersIcon, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function UserDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let role = 'user';
  let fullName = '';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();
    if (profile) {
      role = profile.role;
      fullName = profile.full_name || '';
    }
  }

  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans selection:bg-[#00E599] selection:text-black">

      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content - offset by sidebar width */}
      <div className="md:pl-[68px] relative z-10 min-h-screen flex flex-col pt-14 md:pt-0">

        {/* Hero Section */}
        <div className="pt-20 pb-10 px-6 md:px-10 max-w-5xl mx-auto w-full">
          <div className="mb-2">
            <span className="text-sm text-slate-500 font-medium">¡Hola{fullName ? `, ${fullName}` : ''}!</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Bienvenido a <span className="text-[#00E599]">Sonora</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
            Tu asistente de inteligencia artificial avanzado.
            <br />¿Qué te gustaría hacer hoy?
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="px-6 md:px-10 max-w-5xl mx-auto w-full flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

            {/* Iniciar Conversación */}
            <Link
              href="/home-test"
              className="group relative p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#00E599]/5 hover:border-[#00E599]/20 transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-[#00E599]/10 border border-[#00E599]/20">
                  <MessageSquare className="w-6 h-6 text-[#00E599]" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-[#00E599] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#00E599] transition-colors">
                Iniciar Conversación
              </h3>
              <p className="text-slate-400 text-sm">
                Habla con Sonora sobre cualquier documento o tema.
              </p>
            </Link>

            {/* Mi Perfil */}
            <Link
              href="/profile"
              className="group relative p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] hover:border-white/15 transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/20">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-slate-200 transition-colors">
                Mi Perfil
              </h3>
              <p className="text-slate-400 text-sm">
                Gestiona tu identidad y configuraciones.
              </p>
            </Link>
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80">
                  Panel de Administración
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/admin/knowledge"
                  className="group relative p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-amber-500/5 hover:border-amber-500/10 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <BookOpen className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        Base de Conocimiento
                      </h3>
                      <p className="text-xs text-slate-500">Gestionar documentos del bot</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                </Link>

                <Link
                  href="/admin/users"
                  className="group relative p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-amber-500/5 hover:border-amber-500/10 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <UsersIcon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        Gestión de Usuarios
                      </h3>
                      <p className="text-xs text-slate-500">Crear y administrar usuarios</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}