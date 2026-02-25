"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, UserPlus, Shield, User, Loader2, CheckCircle, XCircle } from "lucide-react";
import AppSidebar from "@/components/app-sidebar";

type UserProfile = {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    pilar_id: number | null;
    created_at: string;
};

const PILARES = [
    { id: 1, nombre: "Administración General" },
    { id: 2, nombre: "Sistema Informático" },
    { id: 3, nombre: "Ventas y Tribus" },
    { id: 4, nombre: "Marketing y Comunicación" },
    { id: 5, nombre: "Legal y Control de Calidad" },
    { id: 6, nombre: "Contable y Finanzas" },
];

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState<"user" | "admin">("user");
    const [pilarId, setPilarId] = useState<number | null>(null);

    const supabase = createClient();

    // Cargar usuarios
    const loadUsers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setUsers(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Crear usuario
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setMessage(null);

        try {
            const response = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, fullName, role, pilarId }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: `Usuario ${email} creado exitosamente` });
                setEmail("");
                setPassword("");
                setFullName("");
                setRole("user");
                setPilarId(null);
                loadUsers(); // Recargar lista
            } else {
                setMessage({ type: "error", text: data.error || "Error al crear usuario" });
            }
        } catch {
            setMessage({ type: "error", text: "Error de conexión" });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans">
            {/* Background Ambience */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="relative z-10 max-w-4xl mx-auto p-6 pt-14 md:pt-6 md:pl-[68px]">

                {/* Sidebar */}
                <AppSidebar />

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-[#00E599]/10 border border-[#00E599]/20">
                            <Users className="w-6 h-6 text-[#00E599]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                            <p className="text-slate-400 text-sm">Crear y administrar usuarios del sistema</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulario de creación */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <UserPlus className="w-5 h-5 text-[#00E599]" />
                                <h2 className="text-lg font-semibold">Crear Usuario</h2>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Nombre completo</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Juan Pérez"
                                        className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Correo electrónico *</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="usuario@ejemplo.com"
                                        required
                                        className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Contraseña *</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                        name="new-password"
                                        className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Rol</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as "user" | "admin")}
                                        className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599]"
                                    >
                                        <option value="user">Usuario Regular</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Pilar (IA Especializada)</label>
                                    <select
                                        value={pilarId || ""}
                                        onChange={(e) => setPilarId(e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599]"
                                    >
                                        <option value="">Sin pilar asignado</option>
                                        {PILARES.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                Pilar {p.id} — {p.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {message && (
                                    <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${message.type === "success"
                                        ? "bg-green-500/10 border border-green-500/20 text-green-400"
                                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                                        }`}>
                                        {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        {message.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full py-3 px-4 bg-[#00E599] hover:bg-[#00E599]/90 text-slate-900 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,229,153,0.2)] hover:shadow-[0_0_30px_rgba(0,229,153,0.4)]"
                                >
                                    {isCreating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creando...
                                        </span>
                                    ) : (
                                        "Crear Usuario"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Lista de usuarios */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold">Usuarios Registrados</h2>
                                <span className="text-sm text-slate-400">{users.length} usuarios</span>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#00E599]" />
                                </div>
                            ) : users.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No hay usuarios registrados</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-black/20 border border-white/5 rounded-xl hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-2 rounded-lg shrink-0 ${user.role === "admin" ? "bg-amber-500/10" : "bg-slate-500/10"}`}>
                                                    {user.role === "admin" ? (
                                                        <Shield className="w-4 h-4 text-amber-400" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-white truncate">
                                                        {user.full_name || user.email}
                                                    </p>
                                                    <p className="text-sm text-slate-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-11 sm:ml-0">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.role === "admin"
                                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                    : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                                                    }`}>
                                                    {user.role === "admin" ? "Admin" : "Usuario"}
                                                </span>
                                                {user.pilar_id && (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        P{user.pilar_id}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
