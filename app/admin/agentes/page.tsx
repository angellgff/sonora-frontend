"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bot, Plus, Trash2, Loader2, CheckCircle, XCircle, FileText, X, MessageCircle } from "lucide-react";
import AppSidebar from "@/components/app-sidebar";

type Agent = {
    id: string;
    name: string;
    description: string;
    system_prompt: string;
    assistant_id: string;
    created_at: string;
};

export default function AdminAgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const supabase = createClient();

    const loadAgents = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("custom_agents")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setAgents(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadAgents();
    }, []);

    const handleCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !systemPrompt) {
            setMessage({ type: "error", text: "Nombre y Promt del Sistema son obligatorios." });
            return;
        }

        setIsCreating(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("system_prompt", systemPrompt);
            
            attachedFiles.forEach(file => {
                formData.append("files", file);
            });

            const response = await fetch("/api/admin/agentes", {
                method: "POST",
                body: formData, // No poner headers de content-type con FormData
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: `Agente "${name}" creado exitosamente (OpenAI ID: ${data.agent.assistant_id})` });
                setIsModalOpen(false);
                resetForm();
                loadAgents();
            } else {
                setMessage({ type: "error", text: data.error || "Error al crear agente" });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Error de conexión con el servidor de IA" });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string, agentName: string) => {
        if (!confirm(`¿Estás SEGURO de eliminar al agente "${agentName}"?\nSe borrará de OpenAI y de la base de datos.`)) return;

        try {
            const res = await fetch(`/api/admin/agentes?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setMessage({ type: "success", text: `Agente eliminado correctamente` });
                loadAgents();
            } else {
                const data = await res.json();
                setMessage({ type: "error", text: data.error || "Error al eliminar" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Error de conexión" });
        }
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setSystemPrompt("");
        setAttachedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachedFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...attachedFiles];
        newFiles.splice(index, 1);
        setAttachedFiles(newFiles);
        if (newFiles.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans">
            {/* Background Ambience */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="relative z-10 max-w-5xl mx-auto p-6 pt-14 md:pt-6 md:pl-[68px]">
                <AppSidebar />

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#00E599]/10 rounded-xl border border-[#00E599]/20">
                            <Bot className="w-6 h-6 text-[#00E599]" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                Fábrica de Agentes
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">Crea IAs especializadas con OpenAI Assistants.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-[#00E599] hover:bg-[#00c785] text-[#050B14] px-4 py-2 rounded-lg font-semibold transition-all shadow-[0_0_15px_rgba(0,229,153,0.3)]"
                    >
                        <Plus className="w-4 h-4" />
                        Crear Nuevo Agente
                    </button>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 backdrop-blur-sm ${message.type === 'success' ? 'bg-[#00E599]/10 border border-[#00E599]/30 text-[#00E599]' : 'bg-red-500/10 border border-red-500/30 text-red-500'}`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                        <p>{message.text}</p>
                    </div>
                )}

                {/* Lista de agentes */}
                <div className="bg-[#0B1221]/80 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                    <div className="p-5 border-b border-white/5">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            Agentes Activos
                            <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs font-medium text-slate-300">
                                {agents.length}
                            </span>
                        </h2>
                    </div>

                    <div className="p-0">
                        {isLoading ? (
                            <div className="p-8 flex justify-center text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : agents.length === 0 ? (
                            <div className="p-12 text-center">
                                <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-300">No hay agentes creados</h3>
                                <p className="text-slate-500 mt-2">Crea el primer agente especializado para tu equipo.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-xs text-slate-400 uppercase bg-white/5">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Agente</th>
                                            <th className="px-6 py-4 font-medium">Descripción</th>
                                            <th className="px-6 py-4 font-medium">Assistant ID</th>
                                            <th className="px-6 py-4 font-medium">Fecha</th>
                                            <th className="px-6 py-4 font-medium text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {agents.map((agent) => (
                                            <tr key={agent.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white">{agent.name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                                                    {agent.description || "-"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-mono bg-white/10 text-slate-300 px-2 py-1 rounded">
                                                        {agent.assistant_id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400 text-sm">
                                                    {new Date(agent.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <a
                                                            href={`/home-test?agentId=${agent.assistant_id}`}
                                                            className="p-2 text-[#00E599] hover:text-[#00c785] hover:bg-[#00E599]/10 rounded-lg transition-colors"
                                                            title="Chatear con el agente"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDelete(agent.id, agent.name)}
                                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                            title="Eliminar agente"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Crear Agente */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-[#0B1221] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0B1221]/95 backdrop-blur-sm z-10">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-[#00E599]" /> Nuevo Agente Especializado
                                </h2>
                                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateAgent} className="p-6 space-y-5">
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre del Agente *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-[#131B2A] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 transition-all"
                                        placeholder="Ej. Asistente Legal Comercial"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Descripción (para identificarlo internamente)</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-[#131B2A] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 transition-all"
                                        placeholder="Breve rol u objetivo..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5 flex justify-between">
                                        <span>System Prompt (Misión e Instrucciones) *</span>
                                        <span className="text-xs text-slate-500">Este es el "Cerebro"</span>
                                    </label>
                                    <textarea
                                        required
                                        value={systemPrompt}
                                        onChange={e => setSystemPrompt(e.target.value)}
                                        rows={6}
                                        className="w-full bg-[#131B2A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 transition-all resize-none font-mono text-sm leading-relaxed"
                                        placeholder="Eres un agente especializado en... Tu objetivo es... Siempre responde usando el formato..."
                                    />
                                </div>

                                {/* Zona de Subida de Archivos */}
                                <div>
                                   <label className="block text-sm font-medium text-slate-300 mb-1.5">Archivos Base de Conocimiento (PDF/DOCX/TXT)</label>
                                   <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:bg-white/[0.02] transition-colors relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">Clic aquí para subir documentos</p>
                                        <p className="text-xs text-slate-500 mt-1">Estos formarán el Vector Store del Agente</p>
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.docx,.txt,.md"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                   </div>
                                   
                                   {attachedFiles.length > 0 && (
                                       <div className="mt-3 space-y-2">
                                           {attachedFiles.map((f, i) => (
                                               <div key={i} className="flex flex-row items-center justify-between text-sm bg-white/5 p-2 px-3 rounded-lg border border-white/5">
                                                   <div className="flex items-center gap-2 truncate">
                                                       <FileText className="w-4 h-4 text-[#00E599]" />
                                                       <span className="truncate max-w-[300px] text-slate-300">{f.name}</span>
                                                       <span className="text-slate-500 text-xs">{(f.size/1024/1024).toFixed(2)} MB</span>
                                                   </div>
                                                   <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-400 p-1">
                                                       <X className="w-4 h-4" />
                                                   </button>
                                               </div>
                                           ))}
                                       </div>
                                   )}
                                </div>

                                <div className="pt-4 border-t border-white/5 flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => { setIsModalOpen(false); resetForm(); }}
                                        className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 font-medium transition-colors"
                                        disabled={isCreating}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="px-6 py-2 rounded-lg bg-[#00E599] hover:bg-[#00c785] text-[#050B14] font-semibold transition-all shadow-[0_0_15px_rgba(0,229,153,0.2)] disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando Agente en OpenAI...</> : "Crear y Guardar"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
