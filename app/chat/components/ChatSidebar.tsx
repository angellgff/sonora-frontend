import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, X, Plus, Trash2, LogOut, Search, Pencil, Check } from "lucide-react";
import { formatDate } from "@/app/_helpers/formatDate";
import type { Conversation } from "@/app/actions/conversations/types";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(isoWeek);

type DateGroup = { label: string; conversations: Conversation[] };

function groupByDate(conversations: Conversation[]): DateGroup[] {
    const groups: Record<string, Conversation[]> = {
        "Hoy": [],
        "Ayer": [],
        "Esta semana": [],
        "Este mes": [],
        "Anteriores": [],
    };
    const now = dayjs();
    for (const conv of conversations) {
        const d = dayjs(conv.last_message_created_at || conv.metadata?.created_at);
        if (!d.isValid()) { groups["Anteriores"].push(conv); continue; }
        if (d.isToday()) groups["Hoy"].push(conv);
        else if (d.isYesterday()) groups["Ayer"].push(conv);
        else if (d.isoWeek() === now.isoWeek() && d.year() === now.year()) groups["Esta semana"].push(conv);
        else if (d.month() === now.month() && d.year() === now.year()) groups["Este mes"].push(conv);
        else groups["Anteriores"].push(conv);
    }
    return Object.entries(groups)
        .filter(([, convs]) => convs.length > 0)
        .map(([label, conversations]) => ({ label, conversations }));
}

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
    selectedId?: string;
    onSelect: (conv: Conversation) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onCreate: () => void;
    onLogout: () => void;
    deletingId: string | null;
    onRename?: (id: string, newTitle: string) => void;
}

export function ChatSidebar({
    isOpen,
    onClose,
    conversations,
    selectedId,
    onSelect,
    onDelete,
    onCreate,
    onLogout,
    deletingId,
    onRename,
}: ChatSidebarProps) {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const confirmConv = conversations.find(c => c?.id === confirmDeleteId);

    const filteredConversations = searchQuery.trim()
        ? conversations.filter(c =>
            c?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c?.last_message_text?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : conversations;

    const groupedConversations = useMemo(() => groupByDate(conversations), [conversations]);

    // Componente reutilizable para cada item de conversación
    function ConversationItem({ conv, selectedId, onSelect, onRequestDelete, deletingId }: {
        conv: Conversation; selectedId?: string; onSelect: (c: Conversation) => void;
        onRequestDelete: (id: string) => void; deletingId: string | null;
    }) {
        const [isEditing, setIsEditing] = useState(false);
        const [editTitle, setEditTitle] = useState(conv?.title || "");

        const handleSaveRename = () => {
            const trimmed = editTitle.trim();
            if (trimmed && trimmed !== conv?.title && conv?.id && onRename) {
                onRename(conv.id, trimmed);
            }
            setIsEditing(false);
        };

        return (
            <div
                className={`group p-3 rounded-xl cursor-pointer transition-all relative border ${selectedId === conv?.id
                    ? "bg-white/10 border-[#00E599]/30 text-white shadow-lg"
                    : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5 text-slate-400 hover:text-slate-200"
                    }`}
                onClick={() => !isEditing && onSelect(conv)}
            >
                <div className="pr-14">
                    {isEditing ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename();
                                    if (e.key === 'Escape') { setIsEditing(false); setEditTitle(conv?.title || ""); }
                                }}
                                autoFocus
                                className="flex-1 bg-white/10 border border-[#00E599]/40 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00E599]/50"
                            />
                            <button onClick={handleSaveRename} className="p-1 rounded-md hover:bg-[#00E599]/20 text-[#00E599]" title="Guardar">
                                <Check className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <h3 className={`font-medium text-sm mb-0.5 truncate ${selectedId === conv?.id ? 'text-[#00E599]' : ''}`}>
                            {conv?.title}
                        </h3>
                    )}
                    <p className="text-xs opacity-70 truncate font-light">
                        {conv?.last_message_text || "Nueva conversación..."}
                    </p>
                    <span className="text-[10px] opacity-40 mt-1 block font-mono">
                        {conv?.last_message_created_at ? formatDate(conv.last_message_created_at) : null}
                    </span>
                </div>
                {/* Botón de renombrar */}
                {!isEditing && onRename && (
                    <Button variant="ghost" size="icon" aria-label="Renombrar"
                        className="absolute top-2 right-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all bg-black/20 hover:bg-[#00E599]/20 hover:text-[#00E599] rounded-lg"
                        onClick={(e) => { e.stopPropagation(); setEditTitle(conv?.title || ""); setIsEditing(true); }}
                        title="Renombrar"
                    >
                        <Pencil className="h-3 w-3" />
                    </Button>
                )}
                {/* Botón de eliminar */}
                <Button variant="ghost" size="icon" aria-label="Eliminar conversación"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all bg-black/20 hover:bg-red-500 hover:text-white rounded-lg"
                    onClick={(e) => { e.stopPropagation(); if (conv?.id) onRequestDelete(conv.id); }}
                    disabled={deletingId === conv?.id} title="Eliminar conversación"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        );
    }


    return (
        <>
            {/* Backdrop para móvil */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-80 lg:w-80 bg-[#050B14]/90 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? "translate-x-0 lg:relative lg:translate-x-0" : "-translate-x-full lg:hidden"
                    }`}
            >
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <h2 className="font-bold text-lg flex items-center gap-2 text-slate-100">
                        <MessageSquare className="w-5 h-5 text-[#00E599]" />
                        Historial
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Cerrar historial"
                        onClick={onClose}
                        className="lg:hidden text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-4 space-y-3">
                    <Button
                        className="w-full justify-start gap-2 cursor-pointer bg-[#00E599] text-slate-900 font-bold hover:bg-[#00E599]/90 shadow-[0_0_15px_rgba(0,229,153,0.15)] hover:shadow-[0_0_25px_rgba(0,229,153,0.3)] transition-all rounded-xl py-6"
                        variant="default"
                        onClick={onCreate}
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Conversación
                    </Button>

                    {/* Barra de búsqueda */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar conversación..."
                            className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00E599]/50 focus:border-[#00E599]/30 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {searchQuery ? (
                        /* Modo búsqueda: lista plana */
                        <>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
                                Resultados ({filteredConversations.length})
                            </p>
                            <div className="space-y-2">
                                {filteredConversations.map((conv) => (
                                    <ConversationItem key={conv?.id} conv={conv} selectedId={selectedId} onSelect={onSelect} onRequestDelete={(id) => setConfirmDeleteId(id)} deletingId={deletingId} />
                                ))}
                            </div>
                        </>
                    ) : (
                        /* Modo normal: agrupado por fecha */
                        groupedConversations.map((group) => (
                            <div key={group.label} className="mb-3">
                                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-1.5">
                                    {group.label}
                                </p>
                                <div className="space-y-1">
                                    {group.conversations.map((conv) => (
                                        <ConversationItem key={conv?.id} conv={conv} selectedId={selectedId} onSelect={onSelect} onRequestDelete={(id) => setConfirmDeleteId(id)} deletingId={deletingId} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}

                    {filteredConversations.length === 0 && (
                        <div className="text-center py-10 px-4">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                                {searchQuery ? <Search className="w-6 h-6 text-slate-600" /> : <MessageSquare className="w-6 h-6 text-slate-600" />}
                            </div>
                            <p className="text-sm text-slate-500">
                                {searchQuery ? "No se encontraron conversaciones" : "No hay historial aún."}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/5 mt-auto bg-black/20">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors h-12"
                        onClick={onLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Modal de confirmación para eliminar */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#0A1628] border border-white/10 rounded-2xl p-6 max-w-sm w-[90%] shadow-2xl">
                        <h3 className="text-white font-bold text-lg mb-2">¿Eliminar conversación?</h3>
                        <p className="text-slate-400 text-sm mb-1">Esta acción no se puede deshacer.</p>
                        {confirmConv && (
                            <p className="text-slate-500 text-xs mb-5 truncate">
                                &ldquo;{confirmConv.title}&rdquo;
                            </p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={(e) => {
                                    onDelete(confirmDeleteId, e as any);
                                    setConfirmDeleteId(null);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </>
    );
}
