"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, UserPlus, Shield, User, Loader2, CheckCircle, XCircle, Trash2 } from "lucide-react";
import AppSidebar from "@/components/app-sidebar";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { UserRowSkeleton } from "@/components/ui/skeleton";

type UserProfile = {
    id: string;
    email: string;
    pilar_id: number | null;
    created_at: string;
};

const PILARES = [
    { id: 1, nombre: "Administración General (Admin)" },
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
    const [isOperating, setIsOperating] = useState<string | null>(null); // ID of user being edited/deleted
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [pilarId, setPilarId] = useState<number>(3); // Default to Pilar Ventas

    const supabase = createClient();

    // Auto dismiss message
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const loadUsers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("id, email, pilar_id, created_at")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setUsers(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setMessage(null);

        try {
            const response = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, fullName, pilarId }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: `Usuario ${email} creado exitosamente` });
                setEmail("");
                setPassword("");
                setFullName("");
                setPilarId(3);
                loadUsers();
            } else {
                setMessage({ type: "error", text: data.error || "Error al crear usuario" });
            }
        } catch {
            setMessage({ type: "error", text: "Error de conexión" });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (user: UserProfile) => {
        if (!confirm(`¿Estás seguro que deseas eliminar permanentemente a ${user.email}?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        setIsOperating(user.id);
        setMessage(null);

        try {
            const response = await fetch(`/api/admin/users?id=${user.id}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: "Usuario eliminado correctamente" });
                setUsers(users.filter(u => u.id !== user.id));
            } else {
                setMessage({ type: "error", text: data.error || "Error al eliminar usuario" });
            }
        } catch {
            setMessage({ type: "error", text: "Error de conexión" });
        } finally {
            setIsOperating(null);
        }
    };

    const handleUpdatePilar = async (userId: string, newPilarId: number) => {
        setIsOperating(userId);
        setMessage(null);

        try {
            const response = await fetch(`/api/admin/users`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userId, pilarId: newPilarId }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: "Pilar actualizado correctamente" });
                setUsers(users.map(u => u.id === userId ? { ...u, pilar_id: newPilarId } : u));
            } else {
                setMessage({ type: "error", text: data.error || "Error al actualizar pilar" });
            }
        } catch {
            setMessage({ type: "error", text: "Error de conexión" });
        } finally {
            setIsOperating(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans">
            {/* Background Ambience */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="relative z-10 max-w-4xl mx-auto p-6 pt-14 md:pt-6 md:pl-[68px]">

                <AppSidebar />

                <Breadcrumbs items={[{ label: "Admin" }, { label: "Gestión de Usuarios" }]} />
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-[#00E599]/10 border border-[#00E599]/20">
                            <Users className="w-6 h-6 text-[#00E599]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                            <p className="text-slate-400 text-sm">Crear, administrar pilares y eliminar usuarios</p>
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
                                    <label className="block text-sm text-slate-400 mb-1">Pilar de IA (Obligatorio)</label>
                                    <select
                                        value={pilarId}
                                        onChange={(e) => setPilarId(parseInt(e.target.value))}
                                        required
                                        className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599]"
                                    >
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
                                        {message.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                                        <span>{message.text}</span>
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
                                <div className="space-y-1">
                                    <UserRowSkeleton />
                                    <UserRowSkeleton />
                                    <UserRowSkeleton />
                                    <UserRowSkeleton />
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
                                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-black/20 border border-white/5 rounded-xl hover:bg-white/5 transition-colors ${isOperating === user.id ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className={`p-2 rounded-lg shrink-0 ${user.pilar_id === 1 ? "bg-amber-500/10" : "bg-[#00E599]/10"}`}>
                                                    {user.pilar_id === 1 ? (
                                                        <Shield className="w-4 h-4 text-amber-400" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-[#00E599]" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-white truncate">
                                                        {user.email} {user.pilar_id === 1 && <span className="text-xs text-amber-400 ml-1 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">Admin</span>}
                                                    </p>
                                                    <p className="text-sm text-slate-400 truncate">Suscrito el {new Date(user.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-11 sm:ml-0 shrink-0">
                                                {/* Select Inline para Pilar */}
                                                <select
                                                    value={user.pilar_id || ""}
                                                    onChange={(e) => handleUpdatePilar(user.id, parseInt(e.target.value))}
                                                    className="px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#00E599] transition-colors cursor-pointer"
                                                >
                                                    {PILARES.map(p => (
                                                        <option key={p.id} value={p.id}>Pilar {p.id}</option>
                                                    ))}
                                                </select>

                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Eliminar usuario"
                                                >
                                                    {isOperating === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
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
