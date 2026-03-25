import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { ChatMessagesSkeleton } from "@/components/ui/skeleton";
import { MessageSquare, Bot, User, Copy, Check } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

function formatMessageTime(timestamp: string): string {
    const d = dayjs(timestamp);
    const now = dayjs();
    if (now.diff(d, 'minute') < 1) return 'ahora';
    if (now.diff(d, 'hour') < 1) return d.fromNow();
    if (d.isSame(now, 'day')) return 'Hoy ' + d.format('H:mm');
    if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Ayer ' + d.format('H:mm');
    return d.format('D MMM, H:mm');
}

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
    pilarId?: number | null;
    onSuggestionClick?: (text: string) => void;
}

const PILAR_SUGGESTIONS: Record<number, string[]> = {
    1: ["¿Cuál es el resumen ejecutivo del mes?", "Muéstrame los indicadores clave de todos los pilares", "Genera un informe de estado del ecosistema"],
    2: ["¿Qué incidentes técnicos están abiertos?", "¿Cómo está el rendimiento del sistema esta semana?", "Dame un checklist de seguridad para revisar"],
    3: ["¿Cuáles son mis metas de ventas este mes?", "Dame 5 técnicas de cierre para mi industria", "¿Cómo puedo mejorar mi tasa de conversión?"],
    4: ["Ayúdame a redactar un post para redes sociales", "¿Qué tendencias de marketing aplican a mi negocio?", "Crea un plan de contenido para esta semana"],
    5: ["¿Qué revisiones legales debo hacer este mes?", "Resume los cambios regulatorios recientes", "Dame un checklist de cumplimiento normativo"],
    6: ["¿Cómo está el flujo de caja este mes?", "Explícame los gastos más significativos", "Dame un resumen financiero ejecutivo"],
};


// Helper para limpiar contenido visualmente
const cleanContent = (text: string) => {
    if (text.includes("[CONTENIDO DE ARCHIVOS]:")) {
        return text.split("[CONTENIDO DE ARCHIVOS]:")[0].trim();
    }
    return text;
};

// Botón de copiar para mensajes del bot
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {}
    };
    return (
        <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10 text-slate-500 hover:text-slate-300"
            title="Copiar respuesta"
        >
            {copied
                ? <Check className="w-3.5 h-3.5 text-[#00E599]" />
                : <Copy className="w-3.5 h-3.5" />
            }
        </button>
    );
}



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
    pilarId,
    onSuggestionClick,
}: ChatAreaProps) {
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll: only if user is near the bottom (not scrolled up reading)
    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
            // Use instant scroll during streaming to avoid animation queue-up
            messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        }
    }, [messages, isTyping]);

    return (
        <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6 custom-scrollbar">
            {/* Estado vacío: sin conversación seleccionada */}
            {!hasSelectedConversation && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-[#00E599]/10 flex items-center justify-center mb-6 border border-[#00E599]/20">
                        <MessageSquare className="w-10 h-10 text-[#00E599]" />
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-slate-200">
                        Espacio de Conversación
                    </h2>
                    <p className="text-slate-500 max-w-sm mb-6">
                        Selecciona una conversación del historial o empieza una nueva para interactuar con Sonora.
                    </p>

                    {/* Feature hints */}
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {[
                            "📎 Adjuntar archivos",
                            "📷 Usar cámara",
                            "📥 Exportar a DOCX",
                            "🔍 Buscar en historial",
                        ].map((hint) => (
                            <span key={hint} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
                                {hint}
                            </span>
                        ))}
                    </div>

                    {/* Sugerencias por pilar */}
                    {pilarId && PILAR_SUGGESTIONS[pilarId] && onSuggestionClick && (
                        <div className="w-full max-w-lg">
                            <p className="text-xs text-slate-600 uppercase tracking-wider mb-3">Prueba preguntando...</p>
                            <div className="flex flex-col gap-2">
                                {PILAR_SUGGESTIONS[pilarId].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => onSuggestionClick(suggestion)}
                                        className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:border-[#00E599]/40 hover:bg-[#00E599]/5 hover:text-white transition-all duration-200 group"
                                    >
                                        <span className="text-[#00E599] mr-2 group-hover:translate-x-0.5 inline-block transition-transform">›</span>
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Estado de carga */}
            {isLoading && (
                <ChatMessagesSkeleton />
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

                    {/* Footer del mensaje: timestamp + copiar */}
                    <div className={`flex items-center gap-2 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-slate-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatMessageTime(msg.timestamp)}
                        </span>
                        {msg.role === 'agent' && (
                            <CopyButton text={cleanContent(msg.content)} />
                        )}
                    </div>
                </div>
                </div>
            ))}

            {/* Indicador de que el bot está escribiendo */}
            {isTyping && (
                <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 border bg-[#00E599]/10 border-[#00E599]/20 shadow-[0_0_15px_rgba(0,229,153,0.1)] text-[#00E599]">
                        <Bot className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm backdrop-blur-md px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-[#00E599] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                <span className="w-2 h-2 bg-[#00E599] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                <span className="w-2 h-2 bg-[#00E599] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                            </div>
                            <span className="text-slate-400 text-sm font-light">Sonora está pensando...</span>
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
