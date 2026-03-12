import AppSidebar from "@/components/app-sidebar";
import Link from "next/link";
import { MessageSquare, User, Shield, BookOpen, Users as UsersIcon, ArrowRight, Activity, FileText, Clock, BarChart3, Bot, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const PILAR_INFO: Record<number, { nombre: string; descripcion: string; tips: string[] }> = {
  1: {
    nombre: "Administración General",
    descripcion: "Supervisás el ecosistema completo. Tu IA cruza datos de todos los pilares para detectar riesgos y proponer acciones estratégicas.",
    tips: [
      "Preguntale a Sonora \"¿cómo está el ecosistema?\" para un resumen rápido",
      "Revisá el Tablero del Fundador para ver la salud global",
      "Podés adjuntar documentos para que Sonora los analice al instante",
    ],
  },
  2: {
    nombre: "Sistema Informático",
    descripcion: "Tu IA monitorea estabilidad técnica, seguridad e integridad de datos. Detecta vulnerabilidades y mantiene el sistema funcionando.",
    tips: [
      "Consultá sobre el estado técnico del sistema",
      "Preguntá por registros de acceso y posibles vulnerabilidades",
      "Subí documentos técnicos para que Sonora los conozca",
    ],
  },
  3: {
    nombre: "Ventas y Tribus",
    descripcion: "Tu IA audita producción comercial, métricas de ventas y detecta desviaciones. Controla adhesiones, conversión y producción por tribu.",
    tips: [
      "Preguntá por métricas de adhesiones y conversión",
      "Consultá sobre el rendimiento de las tribus",
      "Sonora puede detectar patrones sospechosos en ventas",
    ],
  },
  4: {
    nombre: "Marketing y Comunicación",
    descripcion: "Tu IA optimiza la comunicación y evita pérdida publicitaria. Analiza rendimiento de campañas, costo por adhesión y ROI.",
    tips: [
      "Preguntá sobre el rendimiento de tus campañas",
      "Consultá el costo por adhesión actual",
      "Analizá documentos de estrategia de marketing con Sonora",
    ],
  },
  5: {
    nombre: "Legal y Control de Calidad",
    descripcion: "Tu IA detecta incumplimientos contractuales y conductuales. Controla fraude, trazabilidad y riesgo reputacional.",
    tips: [
      "Preguntá sobre incidentes y nivel de gravedad",
      "Consultá sobre cumplimiento contractual",
      "Subí documentos legales para análisis detallado",
    ],
  },
  6: {
    nombre: "Contable y Finanzas",
    descripcion: "Tu IA controla el dinero y la trazabilidad documental. Supervisa flujo de caja, comisiones, pagos y fondo de reserva.",
    tips: [
      "Preguntá sobre el flujo de caja y margen",
      "Consultá comisiones liquidadas y pagos ejecutados",
      "Subí estados financieros para que Sonora los analice",
    ],
  },
};

export default async function UserDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let pilarId: number | null = null;
  let fullName = user?.user_metadata?.full_name || '';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('pilar_id')
      .eq('id', user.id)
      .single();
    if (profile) {
      pilarId = profile.pilar_id;
    }
  }

  const isAdmin = pilarId === 1;
  const pilarInfo = pilarId ? PILAR_INFO[pilarId] : null;

  // Fetch user's own conversation count
  let myConversations = 0;
  if (user) {
    const { count } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    myConversations = count || 0;
  }

  // Admin-only stats
  let totalUsers = 0;
  if (isAdmin) {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    totalUsers = count || 0;
  }

  // Time-based greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans selection:bg-[#00E599] selection:text-black">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/5 rounded-full blur-[150px] pointer-events-none"></div>

      <AppSidebar />

      <div className="md:pl-[68px] relative z-10 min-h-screen flex flex-col pt-14 md:pt-0">

        {/* Hero Section */}
        <div className="pt-16 md:pt-20 pb-6 px-6 md:px-10 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-500 font-medium">{timeGreeting}{fullName ? `, ${fullName}` : ''}.</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">
            Bienvenido a <span className="text-[#00E599]">Sonora</span>
          </h1>
          {pilarInfo && (
            <p className="text-slate-400 text-base max-w-2xl">
              Pilar {pilarId} — <span className="text-white font-medium">{pilarInfo.nombre}</span>
            </p>
          )}
        </div>

        <div className="px-6 md:px-10 max-w-6xl mx-auto w-full flex-1 pb-12">

          {/* Pilar Info Card (for everyone) */}
          {pilarInfo && (
            <div className="mb-8 p-5 md:p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-[#00E599]/10 border border-[#00E599]/20 shrink-0">
                  <Bot className="w-6 h-6 text-[#00E599]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold mb-1">Tu IA Especializada</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{pilarInfo.descripcion}</p>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Sugerencias rápidas</p>
                    {pilarInfo.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Zap className="w-3.5 h-3.5 text-[#00E599] mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-400">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-3 md:gap-4 mb-8`}>
            <div className="p-4 md:p-5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#00E599]"><MessageSquare className="w-4 h-4" /></span>
                <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-500">Mis Conversaciones</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">{myConversations}</p>
            </div>
            {isAdmin && (
              <div className="p-4 md:p-5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400"><UsersIcon className="w-4 h-4" /></span>
                  <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-500">Usuarios Total</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-white">{totalUsers}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              href="/chat"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/admin/tablero"
                  className="group relative p-5 bg-[#00E599]/5 border border-[#00E599]/15 rounded-2xl hover:bg-[#00E599]/10 hover:border-[#00E599]/25 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-[#00E599]/10 border border-[#00E599]/20">
                      <BarChart3 className="w-5 h-5 text-[#00E599]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-[#00E599] transition-colors">
                        Tablero del Fundador
                      </h3>
                      <p className="text-xs text-slate-500">Visión estratégica global</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-[#00E599] transition-colors" />
                  </div>
                </Link>

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
                        Conocimiento
                      </h3>
                      <p className="text-xs text-slate-500">Documentos del bot</p>
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
                        Usuarios
                      </h3>
                      <p className="text-xs text-slate-500">Crear y administrar</p>
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
                        Semáforo
                      </h3>
                      <p className="text-xs text-slate-500">Estado del ecosistema</p>
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