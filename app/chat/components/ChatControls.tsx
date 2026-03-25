import React, { useRef, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, X, Square } from "lucide-react";
import Image from "next/image";

// Helper: icono y color por tipo de archivo
function getFileIcon(fileName: string) {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    switch (ext) {
        case 'pdf': return { icon: '📕', label: 'PDF', color: 'bg-red-500/20 border-red-500/30 text-red-400' };
        case 'doc':
        case 'docx': return { icon: '📘', label: 'DOCX', color: 'bg-blue-500/20 border-blue-500/30 text-blue-400' };
        case 'txt': return { icon: '📝', label: 'TXT', color: 'bg-slate-500/20 border-slate-500/30 text-slate-400' };
        case 'md': return { icon: '📋', label: 'MD', color: 'bg-purple-500/20 border-purple-500/30 text-purple-400' };
        case 'json': return { icon: '📊', label: 'JSON', color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' };
        default: return { icon: '📄', label: ext.toUpperCase(), color: 'bg-slate-500/20 border-slate-500/30 text-slate-400' };
    }
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ChatControlsProps {
    message: string;
    onMessageChange: (value: string) => void;
    isUploading: boolean;
    isStreaming?: boolean;
    onSendMessage: (files?: File[], textFile?: File | null) => void;
    onStop?: () => void;
}

export function ChatControls({
    message,
    onMessageChange,
    isUploading,
    isStreaming = false,
    onSendMessage,
    onStop,
}: ChatControlsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedTextFile, setSelectedTextFile] = useState<File | null>(null);

    // Crear URLs estables para las previews y limpiarlas al desmontar
    const previewUrls = useMemo(() => selectedFiles.map(f => URL.createObjectURL(f)), [selectedFiles]);
    useEffect(() => {
        return () => { previewUrls.forEach(url => URL.revokeObjectURL(url)); };
    }, [previewUrls]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);

            // Separar imagenes de archivos de texto
            const images: File[] = [];
            let textFile: File | null = null;

            filesArray.forEach(file => {
                if (file.type.startsWith("image/")) {
                    images.push(file);
                } else if ([".txt", ".md", ".json", ".pdf", ".doc", ".docx"].some(ext => file.name.toLowerCase().endsWith(ext))) {
                    textFile = file; // solo 1 archivo de texto
                }
            });

            // Limitar a 3 imágenes máximo
            const totalImages = [...selectedFiles, ...images].slice(0, 3);
            setSelectedFiles(totalImages);

            if (textFile) {
                setSelectedTextFile(textFile);
            }
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = () => {
        if (!message.trim() && selectedFiles.length === 0 && !selectedTextFile) return;
        onSendMessage(selectedFiles, selectedTextFile);
        setSelectedFiles([]);
        setSelectedTextFile(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-grow textarea
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }, [message]);

    return (
        <div className="shrink-0 sticky bottom-0 z-20 border-t border-white/5 bg-[#050B14]/95 backdrop-blur-md p-3 md:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="max-w-4xl mx-auto">
                {/* Previsualización de imágenes seleccionadas */}
                {selectedFiles.length > 0 && (
                    <div className="mb-3">
                        {/* Badge con conteo */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-400">
                                📷 {selectedFiles.length}/3 imágenes seleccionadas
                            </span>
                            <button
                                onClick={() => setSelectedFiles([])}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                                Quitar todas
                            </button>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="relative shrink-0 flex flex-col items-center gap-1">
                                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-white/10 hover:border-[#00E599]/30 transition-colors">
                                        <Image
                                            src={previewUrls[index]}
                                            alt={file.name}
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white rounded-full p-1 transition-colors shadow-lg"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <span className="text-[10px] text-slate-500 truncate max-w-[96px]">{file.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Previsualización de archivo de texto */}
                {selectedTextFile && (
                    <div className={`flex items-center gap-3 mb-3 px-3 py-2.5 rounded-xl border ${getFileIcon(selectedTextFile.name).color}`}>
                        <span className="text-xl">{getFileIcon(selectedTextFile.name).icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{selectedTextFile.name}</p>
                            <p className="text-[11px] opacity-70">{getFileIcon(selectedTextFile.name).label} · {formatFileSize(selectedTextFile.size)}</p>
                        </div>
                        <button
                            onClick={() => setSelectedTextFile(null)}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-2 md:gap-3">
                    {/* Input de archivo invisible */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,.md,.json,.pdf,.doc,.docx"
                        multiple
                        onChange={handleFileSelect}
                        disabled={isUploading || selectedFiles.length >= 3}
                    />

                    {/* Boton Clip */}
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Adjuntar archivo"
                        className={`shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-xl border border-transparent hover:bg-white/5 text-slate-400 hover:text-[#00E599] transition-colors ${selectedFiles.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isUploading || selectedFiles.length >= 3}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="w-5 h-5" />
                    </Button>

                    {/* Textarea autoexpandible */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            placeholder={selectedFiles.length > 0 ? "Añade una descripción... (Enter para enviar, Shift+Enter para nueva línea)" : "Escribe para chatear... (Shift+Enter para nueva línea)"}
                            value={message}
                            onChange={(e) => onMessageChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isStreaming}
                            className="w-full resize-none bg-black/20 border border-white/10 focus:border-[#00E599]/50 focus:ring-2 focus:ring-[#00E599]/20 text-slate-200 placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm md:text-base outline-none transition-all min-h-[44px] max-h-[160px] overflow-y-auto custom-scrollbar leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ height: '44px' }}
                        />
                    </div>

                    {/* Botón Detener o Enviar */}
                    {isStreaming ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Detener generación"
                            className="shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all"
                            onClick={onStop}
                        >
                            <Square className="w-4 h-4 fill-current" />
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Enviar mensaje"
                            className={`shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-xl transition-all duration-300 ${(!message.trim() && selectedFiles.length === 0 && !selectedTextFile)
                                ? "bg-white/5 text-slate-600 cursor-not-allowed"
                                : "bg-[#00E599] text-slate-900 hover:bg-[#00E599]/90 hover:scale-105 shadow-[0_0_15px_rgba(0,229,153,0.3)]"
                                }`}
                            disabled={(!message.trim() && selectedFiles.length === 0 && !selectedTextFile)}
                            onClick={handleSend}
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
