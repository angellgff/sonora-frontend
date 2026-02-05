import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Paperclip, Send, X } from "lucide-react";
import Image from "next/image";

interface ChatControlsProps {
    message: string;
    onMessageChange: (value: string) => void;
    isRecording: boolean;
    onToggleRecording: () => void;
    isConnected: boolean;
    isUploading: boolean;
    onSendMessage: (files?: File[], textFile?: File | null) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function ChatControls({
    message,
    onMessageChange,
    isRecording,
    onToggleRecording,
    isConnected,
    isUploading,
    onSendMessage,
    onKeyDown,
}: ChatControlsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedTextFile, setSelectedTextFile] = useState<File | null>(null);

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
        onSendMessage(selectedFiles, selectedTextFile);
        setSelectedFiles([]);
        setSelectedTextFile(null);
    };

    const handleKeyDownWrapper = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isRecording && (message.trim() || selectedFiles.length > 0)) {
            handleSend();
        } else {
            onKeyDown(e);
        }
    };

    return (
        <div className="shrink-0 sticky bottom-0 z-20 border-t border-white/5 bg-[#050B14]/95 backdrop-blur-md p-3 md:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="max-w-4xl mx-auto">
                {/* Previsualización de imágenes seleccionadas */}
                {selectedFiles.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="relative w-20 h-20 shrink-0 group">
                                <Image
                                    src={URL.createObjectURL(file)}
                                    alt="Preview"
                                    fill
                                    className="object-cover rounded-xl border border-white/10"
                                />
                                <button
                                    onClick={() => removeFile(index)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {selectedTextFile && (
                    <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full text-sm">
                        <span>{selectedTextFile.name}</span>
                        <button
                            onClick={() => setSelectedTextFile(null)}
                            className="hover:text-red-400"
                        >
                            X
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-2 md:gap-3">
                    {/* Botón de audio */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-xl border transition-all duration-300 ${isRecording
                            ? "bg-red-500/20 border-red-500/50 text-red-500 animate-pulse"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                            }`}
                        onClick={onToggleRecording}
                        disabled={selectedFiles.length > 0}
                    >
                        <Mic className={`w-5 h-5 ${isRecording ? "scale-110" : ""}`} />
                    </Button>

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
                        className={`shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-xl border border-transparent hover:bg-white/5 text-slate-400 hover:text-[#00E599] transition-colors ${selectedFiles.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isUploading || selectedFiles.length >= 3}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="w-5 h-5" />
                    </Button>

                    {/* Input de texto */}
                    <div className="flex-1 relative">
                        <Input
                            placeholder={isConnected ? "🎤 Usa tu voz para hablar..." : (selectedFiles.length > 0 ? "Añade una descripción..." : "Escribe para chatear...")}
                            value={message}
                            onChange={(e) => onMessageChange(e.target.value)}
                            onKeyDown={handleKeyDownWrapper}
                            className="h-10 md:h-12 text-sm md:text-base bg-black/20 border-white/10 focus:border-[#00E599]/50 focus:ring-[#00E599]/20 text-slate-200 placeholder:text-slate-500 rounded-xl"
                            disabled={isRecording || isConnected}
                        />
                    </div>

                    {/* Botón de enviar */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-xl transition-all duration-300 ${(!message.trim() && selectedFiles.length === 0 && !selectedTextFile) || isRecording
                            ? "bg-white/5 text-slate-600 cursor-not-allowed"
                            : "bg-[#00E599] text-slate-900 hover:bg-[#00E599]/90 hover:scale-105 shadow-[0_0_15px_rgba(0,229,153,0.3)]"
                            }`}
                        disabled={(!message.trim() && selectedFiles.length === 0 && !selectedTextFile) || isRecording}
                        onClick={handleSend}
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>

                {isRecording && (
                    <div className="mt-3 text-center">
                        <p className="text-xs md:text-sm text-red-400 animate-pulse flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Grabando audio...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
