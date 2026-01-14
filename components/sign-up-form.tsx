"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Bot, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/protected`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full max-w-md p-8 relative z-10", className)} {...props}>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00E599]/10 border border-[#00E599]/20 mb-4 shadow-[0_0_15px_rgba(0,229,153,0.1)]">
            <Bot className="w-8 h-8 text-[#00E599]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Crear Cuenta</h1>
          <p className="mt-2 text-sm text-slate-400">
            Únete a la plataforma inteligente Sonora
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          {error && (
            <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3.5 border border-white/10 bg-black/20 text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599] transition-all sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="Contraseña"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3.5 border border-white/10 bg-black/20 text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599] transition-all sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="repeat-password" className="sr-only">
                Repetir Contraseña
              </label>
              <input
                id="repeat-password"
                type="password"
                placeholder="Confirmar Contraseña"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3.5 border border-white/10 bg-black/20 text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599] transition-all sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-slate-900 bg-[#00E599] hover:bg-[#00E599]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E599] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,229,153,0.2)] hover:shadow-[0_0_30px_rgba(0,229,153,0.4)] transition-all hover:-translate-y-0.5"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando cuenta...
              </span>
            ) : (
              "Registrarse"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-[#00E599] hover:text-[#00E599]/80 hover:underline transition-all"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
