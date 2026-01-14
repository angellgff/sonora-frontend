import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, X, Plus, Trash2, LogOut } from "lucide-react";
import { formatDate } from "@/app/_helpers/formatDate";
import type { Conversation } from "@/app/actions/conversations/types";

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
}: ChatSidebarProps) {
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
                        onClick={onClose}
                        className="lg:hidden text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-4">
                    <Button
                        className="w-full justify-start gap-2 cursor-pointer bg-[#00E599] text-slate-900 font-bold hover:bg-[#00E599]/90 shadow-[0_0_15px_rgba(0,229,153,0.15)] hover:shadow-[0_0_25px_rgba(0,229,153,0.3)] transition-all rounded-xl py-6"
                        variant="default"
                        onClick={onCreate}
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Conversación
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {/* Sección "Hoy" u organizada cronológicamente en el futuro */}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Recientes</p>

                    <div className="space-y-2">
                        {conversations.map((conv) => (
                            <div
                                key={conv?.id}
                                className={`group p-3.5 rounded-xl cursor-pointer transition-all relative border ${selectedId === conv?.id
                                    ? "bg-white/10 border-[#00E599]/30 text-white shadow-lg"
                                    : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5 text-slate-400 hover:text-slate-200"
                                    }`}
                                onClick={() => onSelect(conv)}
                            >
                                <div className="pr-8">
                                    <h3 className={`font-medium text-sm mb-1 truncate ${selectedId === conv?.id ? 'text-[#00E599]' : ''}`}>
                                        {conv?.title}
                                    </h3>
                                    <p className="text-xs opacity-70 truncate font-light">
                                        {conv?.last_message_text || "Nueva conversación..."}
                                    </p>
                                    <span className="text-[10px] opacity-40 mt-1.5 block font-mono">
                                        {conv?.last_message_created_at
                                            ? formatDate(conv.last_message_created_at)
                                            : null}
                                    </span>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all bg-black/20 hover:bg-red-500 hover:text-white rounded-lg"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (conv?.id) onDelete(conv.id, e);
                                    }}
                                    disabled={deletingId === conv?.id}
                                    title="Eliminar conversación"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}

                        {conversations.length === 0 && (
                            <div className="text-center py-10 px-4">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                                    <MessageSquare className="w-6 h-6 text-slate-600" />
                                </div>
                                <p className="text-sm text-slate-500">No hay historial aún.</p>
                            </div>
                        )}
                    </div>
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
