import AppSidebar from "@/components/app-sidebar";
import Link from "next/link";
import { MessageSquare, User, Shield, BookOpen, Users as UsersIcon, ArrowRight, Activity, FileText, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function UserDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let role = 'user';
  let fullName = '';
  let pilarNombre = '';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, pilar_id')
      .eq('id', user.id)
      .single();
    if (profile) {
      role = profile.role;
      fullName = profile.full_name || '';
      const PILAR_NOMBRES: Record<number, string> = {
        1: "Administración General", 2: "Sistema Informático", 3: "Ventas y Tribus",
        4: "Marketing y Comunicación", 5: "Legal y Control de Calidad", 6: "Contable y Finanzas",
      };
      pilarNombre = profile.pilar_id ? PILAR_NOMBRES[profile.pilar_id] || '' : '';
    }
  }

  const isAdmin = role === 'admin';

  // Fetch quick stats for admin
  let totalConversations = 0;
  let totalDocs = 0;
  let totalUsers = 0;

  if (isAdmin) {
    const [convos, docs, users] = await Promise.all([
      supabase.from('conversations').select('id', { count: 'exact', head: true }),
      supabase.from('knowledge_base').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);
    totalConversations = convos.count || 0;
    totalDocs = docs.count || 0;
    totalUsers = users.count || 0;
  }

  // Time-based greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans selection:bg-[#00E599] selection:text-black">

      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="md:pl-[68px] relative z-10 min-h-screen flex flex-col pt-14 md:pt-0">

        {/* Hero Section */}
        <div className="pt-16 md:pt-20 pb-8 px-6 md:px-10 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-500 font-medium">{timeGreeting}{fullName ? `, ${fullName}` : ''}.</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">
            Bienvenido a <span className="text-[#00E599]">Sonora</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xl">
            {pilarNombre
              ? <>Estás asignado al pilar <span className="text-white font-medium">{pilarNombre}</span>.</>
              : <>Tu asistente de inteligencia artificial avanzado.</>
            }
          </p>
        </div>

        {/* Content */}
        <div className="px-6 md:px-10 max-w-6xl mx-auto w-full flex-1 pb-12">

          {/* Admin Quick Stats */}
          {isAdmin && (
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
              {[
                { label: "Conversaciones", value: totalConversations, icon: <MessageSquare className="w-4 h-4" />, color: "text-[#00E599]" },
                { label: "Documentos KB", value: totalDocs, icon: <FileText className="w-4 h-4" />, color: "text-blue-400" },
                { label: "Usuarios", value: totalUsers, icon: <UsersIcon className="w-4 h-4" />, color: "text-purple-400" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 md:p-5 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={stat.color}>{stat.icon}</span>
                    <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

            {/* Iniciar Conversación — principal */}
            <Link
              href="/home-test"
              className="group relative p-6 bg-[#00E599]/5 border border-[#00E599]/15 rounded-2xl hover:bg-[#00E599]/10 hover:border-[#00E599]/30 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_-12px_rgba(0,229,153,0.3)]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-[#00E599]/10 border border-[#00E599]/20">
                  <MessageSquare className="w-6 h-6 text-[#00E599]" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-[#00E599] group-hover:translate-x-1 transition-all" />
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
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <Link
                  href="/admin/pilares"
                  className="group relative p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-amber-500/5 hover:border-amber-500/10 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Activity className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        Semáforo de Pilares
                      </h3>
                      <p className="text-xs text-slate-500">Estado operativo del ecosistema</p>
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