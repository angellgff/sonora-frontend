"use client";

import React, { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Camera, User, Mail, Shield, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
import AppSidebar from "@/components/app-sidebar";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [role, setRole] = useState("user");
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Supabase Client
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/auth/login");
                return;
            }

            setUser(user);
            setFullName(user.user_metadata?.full_name || "");
            setAvatarUrl(user.user_metadata?.avatar_url || null);

            // Fetch Role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile) setRole(profile.role);

            setLoading(false);
        };

        fetchProfile();
    }, [router, supabase]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            setSaving(true);
            setStatus({ type: null, message: '' });

            const fileExt = file.name.split('.').pop();
            const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;

            // Upload to 'chat-images' bucket (reusing existing bucket)
            const { error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-images')
                .getPublicUrl(fileName);

            setAvatarUrl(publicUrl);

            // Update User Metadata immediately to show feedback
            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            setStatus({ type: 'success', message: 'Foto de perfil actualizada' });

        } catch (error: any) {
            console.error("Avatar upload error:", error);
            setStatus({ type: 'error', message: 'Error subiendo la imagen' });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setSaving(true);
            setStatus({ type: null, message: '' });

            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) throw error;

            setStatus({ type: 'success', message: 'Perfil actualizado correctamente' });
            router.refresh();

        } catch (error: any) {
            console.error("Profile update error:", error);
            setStatus({ type: 'error', message: 'No se pudo actualizar el perfil' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#00E599] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050B14] font-sans text-slate-200 relative">

            {/* Background Ambience */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/5 rounded-full blur-[150px] pointer-events-none"></div>

            {/* Sidebar */}
            <AppSidebar />

            {/* Main content with sidebar offset */}
            <div className="md:pl-[68px] pt-16 md:pt-10 px-4 md:px-8 max-w-2xl mx-auto">

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
                    <p className="text-slate-400">Gestiona tu identidad en Sonora</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">

                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-8 relative">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full border-4 border-[#050B14] shadow-xl overflow-hidden bg-slate-800 relative ring-2 ring-[#00E599]/20 group-hover:ring-[#00E599] transition-all">
                                {avatarUrl ? (
                                    <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                        <User className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2.5 bg-[#00E599] text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                                title="Cambiar foto"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={saving}
                            />
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-300">
                            {fullName || "Usuario sin nombre"}
                        </p>
                        <span className={`mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${role === 'admin' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                            {role.toUpperCase()}
                        </span>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg mx-auto">

                        {status.message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                {status.message}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599] transition-all placeholder:text-slate-600"
                                    placeholder="Tu nombre aquí"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Correo Electrónico</label>
                            <div className="relative opacity-60">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full bg-black/20 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-slate-400 cursor-not-allowed"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2" title="Información protegida por el sistema">
                                    <Shield className="w-4 h-4 text-slate-600" />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-600 ml-1">El correo electrónico es gestionado por el administrador del sistema.</p>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 bg-[#00E599] hover:bg-[#00E599]/90 text-slate-900 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,229,153,0.2)] hover:shadow-[0_0_30px_rgba(0,229,153,0.4)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>

                    </form>

                </div>
            </div>
        </div>
    );
}
