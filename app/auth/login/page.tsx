"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation"
import Link from "next/link";
import { Bot } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder";

  const supabase = createBrowserClient(supabaseUrl, supabaseKey);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError("Credenciales invalidas. Por favor intenta de nuevo.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Ocurrio un error inesperado.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="flex items-center justify-center min-h-screen bg-[#050B14] font-sans text-slate-200 relative overflow-hidden">

      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10">

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00E599]/10 border border-[#00E599]/20 mb-4 shadow-[0_0_15px_rgba(0,229,153,0.1)]">
              <Bot className="w-8 h-8 text-[#00E599]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Iniciar Sesión</h1>
            <p className="mt-2 text-sm text-slate-400">
              Accede a la inteligencia de Sonora
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Correo electrónico
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3.5 border border-white/10 bg-black/20 text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599] transition-all sm:text-sm"
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3.5 border border-white/10 bg-black/20 text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599] transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-[#00E599] hover:text-[#00E599]/80 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-slate-900 bg-[#00E599] hover:bg-[#00E599]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E599] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,229,153,0.2)] hover:shadow-[0_0_30px_rgba(0,229,153,0.4)] transition-all hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                    Accediendo...
                  </span>
                ) : "Ingresar al Sistema"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-[#00E599] hover:text-[#00E599]/80 hover:underline transition-all"
            >
              Solicitar acceso
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
