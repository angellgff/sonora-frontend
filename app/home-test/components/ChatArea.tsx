import React from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { MessageSquare, Bot, User } from "lucide-react";

// Definimos la interfaz Message aquí o la importamos si está en un archivo común
// Por ahora la definimos aquí para ser autocontenidos, idealmente debería estar en types.ts
export type Message = {
    id: string;
    role: "user" | "agent";
    content: string;
    timestamp: string;
    type: "text" | "audio";
    isFinal?: boolean;
    images?: string[];
};

interface ChatAreaProps {
    messages: Message[];
    isLoading: boolean;
    hasSelectedConversation: boolean;
    isTyping?: boolean;
}

// Helper para limpiar contenido visualmente
const cleanContent = (text: string) => {
    if (text.includes("[CONTENIDO DE ARCHIVOS]:")) {
        return text.split("[CONTENIDO DE ARCHIVOS]:")[0].trim();
    }
    return text;
};

// Componente para renderizar markdown en mensajes del bot
function MarkdownMessage({ content }: { content: string }) {
    // Pre-procesar: unir números sueltos con la línea siguiente
    // El modelo a veces pone "1.\n**Título:**" en vez de "1. **Título:**"
    const processed = content.replace(/(\d+)\.\s*\n+\s*(\*{0,2})/g, '$1. $2');

    return (
        <ReactMarkdown
            components={{
                p: ({ children }) => (
                    <p className="text-sm md:text-base leading-relaxed font-light mb-2 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                    <strong className="font-semibold text-white">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="italic text-slate-300">{children}</em>
                ),
                h1: ({ children }) => (
                    <h3 className="text-base font-bold text-white mt-3 mb-1">{children}</h3>
                ),
                h2: ({ children }) => (
                    <h3 className="text-base font-bold text-white mt-3 mb-1">{children}</h3>
                ),
                h3: ({ children }) => (
                    <h4 className="text-sm font-bold text-white mt-2 mb-1">{children}</h4>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 my-2 text-sm md:text-base font-light">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 my-2 text-sm md:text-base font-light">{children}</ol>
                ),
                li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                ),
                code: ({ children, className }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                        return (
                            <pre className="bg-black/30 border border-white/10 rounded-lg p-3 my-2 overflow-x-auto">
                                <code className="text-xs text-green-300 font-mono">{children}</code>
                            </pre>
                        );
                    }
                    return (
                        <code className="bg-white/10 text-[#00E599] px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                    );
                },
                pre: ({ children }) => <>{children}</>,
                a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#00E599] underline hover:text-[#00E599]/80 transition-colors">
                        {children}
                    </a>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-[#00E599]/40 pl-3 my-2 text-slate-300 italic">{children}</blockquote>
                ),
                hr: () => <hr className="border-white/10 my-3" />,
            }}
        >
            {processed}
        </ReactMarkdown>
    );
}

export function ChatArea({
    messages,
    isLoading,
    hasSelectedConversation,
    isTyping = false,
}: ChatAreaProps) {
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll al fondo cuando cambian los mensajes
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6 custom-scrollbar">
            {/* Estado vacío: sin conversación seleccionada */}
            {!hasSelectedConversation && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                        <MessageSquare className="w-10 h-10 text-slate-600" />
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-slate-200">
                        Espacio de Conversación
                    </h2>
                    <p className="text-slate-500 max-w-sm">
                        Selecciona o crea una nueva conversación para interactuar con la inteligencia de Sonora.
                    </p>
                </div>
            )}

            {/* Estado de carga */}
            {isLoading && (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="w-8 h-8 rounded-full border-2 border-[#00E599] border-t-transparent animate-spin mx-auto mb-3" />
                        <p className="text-xs text-[#00E599] font-medium tracking-wide uppercase">Cargando...</p>
                    </div>
                </div>
            )}

            {/* Mensajes */}
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`group flex items-start gap-3 md:gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""
                        }`}
                >
                    {/* Avatar */}
                    <div
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 border ${msg.role === "agent"
                            ? "bg-[#00E599]/10 border-[#00E599]/20 shadow-[0_0_15px_rgba(0,229,153,0.1)] text-[#00E599]"
                            : "bg-white/10 border-white/10 text-slate-300"
                            }`}
                    >
                        {msg.role === "agent" ? (
                            <Bot className="w-5 h-5 md:w-6 md:h-6" />
                        ) : (
                            <User className="w-5 h-5 md:w-6 md:h-6" />
                        )}
                    </div>

                    {/* Mensaje */}
                    <div
                        className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"
                            }`}
                    >
                        <div
                            className={`p-3 md:p-4 rounded-2xl relative transition-all duration-300 ${msg.role === "user"
                                ? "bg-[#00E599] text-slate-900 rounded-tr-sm shadow-[0_0_20px_rgba(0,229,153,0.15)]"
                                : "bg-white/5 border border-white/5 text-slate-100 rounded-tl-sm backdrop-blur-md hover:bg-white/10"
                                }`}
                        >
                            {msg.type === "audio" ? (
                                <div className="space-y-2">
                                    <p className={`text-sm md:text-base leading-relaxed wrap-break-word ${msg.role === 'user' ? 'font-medium' : 'font-light'}`}>
                                        {cleanContent(msg.content)}
                                    </p>

                                    {/* Renderizar Imagenes si existen */}
                                    {msg.images && msg.images.length > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {msg.images.map((img, idx) => (
                                                <div key={idx} className="relative w-32 h-32 md:w-48 md:h-48 rounded-xl overflow-hidden border border-black/10 shadow-sm cursor-zoom-in">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={img}
                                                        alt="Imagen adjunta"
                                                        className="object-cover w-full h-full hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {msg.isFinal === false && (
                                        <div className="flex items-center gap-2 text-xs opacity-70 mt-2">
                                            <div className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                                            </div>
                                            <span className="font-medium tracking-wide uppercase text-[10px]">
                                                {msg.role === "user" ? "Escuchando..." : "Pensando..."}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {msg.role === "agent" ? (
                                        <MarkdownMessage content={cleanContent(msg.content)} />
                                    ) : (
                                        <p className="text-sm md:text-base leading-relaxed wrap-break-word font-medium">
                                            {cleanContent(msg.content)}
                                        </p>
                                    )}

                                    {/* Renderizar Imagenes si existen (Text Msg) */}
                                    {msg.images && msg.images.length > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {msg.images.map((img, idx) => (
                                                <div key={idx} className="relative w-32 h-32 md:w-48 md:h-48 rounded-xl overflow-hidden border border-black/10 shadow-sm">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={img}
                                                        alt="Imagen adjunta"
                                                        className="object-cover w-full h-full hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] text-slate-500 px-1 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            {msg.timestamp}
                        </span>
                    </div>
                </div>
            ))}

            {/* Indicador de que el bot está escribiendo */}
            {isTyping && (
                <div className="flex items-start gap-2 md:gap-3 px-3 md:px-4 mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-xl bg-[#00E599]/20 flex items-center justify-center">
                        <span className="text-lg">🤖</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-[#00E599] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                <span className="w-2 h-2 bg-[#00E599] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                <span className="w-2 h-2 bg-[#00E599] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                            </div>
                            <span className="text-slate-400 text-sm">Pensando...</span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} className="h-4" />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
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
        </div>
    );
}
