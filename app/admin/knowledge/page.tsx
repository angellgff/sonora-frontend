"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, RefreshCw, X, MessageSquare, Download } from "lucide-react";
import AppSidebar from "@/components/app-sidebar";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface KnowledgeFile {
  name: string;
  type: string;
  created_at: string;
  chunks: number;
}

export default function KnowledgeDashboard() {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [mounted, setMounted] = useState(false);
  const [selectedPilarId, setSelectedPilarId] = useState<number | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const [confirmDeleteFilename, setConfirmDeleteFilename] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar lista de archivos
  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/knowledge-files");
      const data = await res.json();
      if (data.files) setFiles(data.files);
    } catch (error) {
      console.error("Error cargando archivos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Función Borrar (ejecuta la eliminación real)
  const confirmDelete = async () => {
    if (!confirmDeleteFilename) return;
    const filename = confirmDeleteFilename;
    setConfirmDeleteFilename(null);

    try {
      const res = await fetch("/api/admin/knowledge-files", {
        method: "DELETE",
        body: JSON.stringify({ filename }),
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", "Archivo eliminado correctamente");
        loadFiles();
      }
    } catch (error) {
      showToast("error", "Error eliminando archivo");
    }
  };

  // Funcion descargar
  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(`/api/admin/download-knowledge?filename=${encodeURIComponent(filename)}`);

      if (!response.ok) {
        const error = await response.json();
        showToast("error", error.error || "Error al descargar");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error descargando:", error);
      showToast("error", "Error al descargar el archivo");
    }
  };
  // Función de chunking semántico: respeta párrafos y agrega overlap
  const splitTextIntoChunks = (text: string, maxChunkSize = 2000, overlap = 200) => {
    // 1. Dividir por párrafos (doble salto de línea) o secciones
    const paragraphs = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // Si no hay párrafos claros, split por saltos simples
    const segments = paragraphs.length <= 1
      ? text.split(/\n/).map(s => s.trim()).filter(s => s.length > 0)
      : paragraphs;

    const chunks: string[] = [];
    let currentChunk = '';

    for (const segment of segments) {
      // Si un solo segmento excede el máximo, lo partimos con overlap
      if (segment.length > maxChunkSize) {
        // Guardar lo acumulado primero
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        // Partir el segmento largo con overlap
        let start = 0;
        while (start < segment.length) {
          const end = Math.min(start + maxChunkSize, segment.length);
          chunks.push(segment.slice(start, end));
          start += maxChunkSize - overlap;
          if (start + overlap >= segment.length) break;
        }
        continue;
      }

      // Si agregar este segmento excede el límite, guardar y empezar nuevo chunk
      const separator = currentChunk ? '\n\n' : '';
      if ((currentChunk + separator + segment).length > maxChunkSize) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          // Overlap: tomar los últimos ~overlap caracteres del chunk anterior
          const overlapText = currentChunk.slice(-overlap).trim();
          currentChunk = overlapText + '\n\n' + segment;
        } else {
          currentChunk = segment;
        }
      } else {
        currentChunk += separator + segment;
      }
    }

    // Agregar el último chunk si tiene contenido
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    let totalChunks = 0;
    let processedChunks = 0;
    let storagePath: string | null = null; // Para rollback si falla

    try {
      // PASO 1: Extracción de Texto + subida a Storage
      setUploadStatus({ type: null, message: 'Subiendo archivo y extrayendo texto...' });

      const extractForm = new FormData();
      extractForm.append("file", file);

      const extractRes = await fetch("/api/admin/extract-text", { method: "POST", body: extractForm });
      const extractData = await extractRes.json();

      if (!extractRes.ok) throw new Error(extractData.error || "Error extrayendo texto");

      const text = extractData.text;
      storagePath = extractData.storagePath; // Guardamos para rollback
      if (!text || text.length === 0) throw new Error("Archivo subido pero sin texto legible");

      // PASO 2: Chunking en Cliente
      setUploadStatus({ type: null, message: 'Dividiendo información...' });
      const chunks = splitTextIntoChunks(text, 2000);
      totalChunks = chunks.length;

      // PASO 3: Subida por Lotes (Batch Upload)
      const BATCH_SIZE = 50;

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const progress = Math.round(((i) / chunks.length) * 100);

        setUploadStatus({
          type: null,
          message: `Memorizando parte ${Math.ceil((i + 1) / BATCH_SIZE)} de ${Math.ceil(chunks.length / BATCH_SIZE)} (${progress}%)`
        });

        const saveBody = {
          chunks: batch,
          fileName: file.name,
          fileType: file.type,
          storagePath: storagePath,
          startIndex: i,
          pilarId: selectedPilarId,
        };

        const saveRes = await fetch("/api/admin/save-chunks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveBody)
        });

        if (!saveRes.ok) {
          const errorData = await saveRes.json();
          throw new Error(`Error en lote ${Math.ceil((i + 1) / BATCH_SIZE)}: ${errorData.error}`);
        }

        processedChunks += batch.length;
      }

      setUploadStatus({ type: 'success', message: `¡Éxito! ${processedChunks} fragmentos aprendidos.` });
      setTimeout(() => {
        closeModal();
        loadFiles();
      }, 2000);

    } catch (error: any) {
      console.error(error);
      // ROLLBACK: Si ya se subió a Storage pero falló el guardado en KB, limpiar Storage
      if (storagePath) {
        console.warn('🔄 Rollback: limpiando archivo huérfano de Storage...');
        try {
          // Limpiar Storage usando la API de delete (también limpia KB por si quedó algo parcial)
          await fetch("/api/admin/knowledge-files", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name })
          });
          console.log('✅ Rollback completado: Storage y KB limpiados');
        } catch (cleanupError) {
          console.error('❌ Error durante rollback:', cleanupError);
        }
      }
      setUploadStatus({ type: 'error', message: error.message || "Error desconocido" });
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setIsUploadModalOpen(false);
    setPendingFile(null);
    setSelectedPilarId(null);
    setUploadStatus({ type: null, message: '' });
  };

  // -- Componente Visual --
  if (!mounted) return null; // Prevenir error de hidratación (se renderiza solo en cliente)

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans selection:bg-[#00E599] selection:text-black relative overflow-x-hidden">

      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Sidebar */}
      <AppSidebar />

      {/* Main content with sidebar offset */}
      <div className="md:pl-[68px] relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl mt-8 mb-20 pt-14 md:pt-6">

        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              Gestión de Conocimientos <span className="text-3xl">🧠</span>
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">Administra los documentos que alimentan la inteligencia de Bot Sonora.</p>
          </div>
          <div className="flex gap-3">
            {/* Botón Ir al Chat */}
            <Link href="/home-test" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium text-slate-300 hover:text-[#00E599]">
              <MessageSquare className="w-4 h-4" /> <span className="hidden md:inline">Probar Chat</span>
            </Link>

            {/* Botón Actualizar (Existente) */}
            <button onClick={() => loadFiles()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-medium">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </button>
            {/* Botón Subir (Existente) */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00E599] text-slate-900 font-bold shadow-[0_0_20px_rgba(0,229,153,0.2)] hover:shadow-[0_0_30px_rgba(0,229,153,0.4)] hover:-translate-y-0.5 transition-all text-sm"
            >
              <Upload className="w-4 h-4" /> Subir Nuevo
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Documentos Activos" value={files.length} icon={<FileText className="text-[#00E599]" />} color="bg-[#00E599]/10" />
          <StatCard title="Fragmentos (Chunks)" value={files.reduce((acc, curr) => acc + curr.chunks, 0)} icon={<div className="text-blue-500">🧩</div>} color="bg-blue-500/10" />
          <StatCard title="Estado del Sistema" value="Online" icon={<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />} color="bg-purple-500/10" isText sm />
        </div>

        {/* File List Table */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="hidden md:grid grid-cols-12 gap-4 p-5 border-b border-white/5 bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <div className="col-span-6 pl-2">Nombre del Archivo</div>
            <div className="col-span-2 text-center">Formato</div>
            <div className="col-span-2 text-right">Creado</div>
            <div className="col-span-2 text-right pr-2">Acciones</div>
          </div>

          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Cargando memoria...</div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No hay documentos en memoria aún.</div>
            ) : (
              files.map((file, idx) => (
                <div key={idx} className="group p-4 hover:bg-white/[0.02] transition-colors">
                  {/* Mobile: stacked layout */}
                  <div className="flex items-center gap-3 md:hidden">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border ${getFileIconColor(file.type).bg} ${getFileIconColor(file.type).border}`}>
                      <FileText className={`w-5 h-5 ${getFileIconColor(file.type).text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-[#00E599] transition-colors">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-slate-300">
                          {getFileFormatLabel(file.type)}
                        </span>
                        <span className="text-xs text-slate-500">{file.chunks} chunks</span>
                        <span className="text-xs text-slate-500">{new Date(file.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDownload(file.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#00E599] hover:bg-[#00E599]/10 transition-all"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteFilename(file.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop: grid layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 flex items-center gap-4 pl-2">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border ${getFileIconColor(file.type).bg} ${getFileIconColor(file.type).border}`}>
                        <FileText className={`w-5 h-5 ${getFileIconColor(file.type).text}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-[#00E599] transition-colors">{file.name}</p>
                        <p className="text-xs text-slate-500">{file.chunks} chunks</p>
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-slate-300">
                        {getFileFormatLabel(file.type)}
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-sm text-slate-400">
                      {new Date(file.created_at).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 flex justify-end pr-2">
                      <button
                        onClick={() => handleDownload(file.name)}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#00E599]/10 hover:bg-[#00E599]/10 transition-all"
                        title="Descargar archivo"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteFilename(file.name)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Eliminar memoria"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MODAL DE CARGA (Overlay) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
            <button onClick={() => closeModal()} className="absolute top-4 right-4 text-slate-400 hover:text-white" disabled={isUploading}><X /></button>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Añadir Conocimiento</h2>
              <p className="text-slate-400 text-sm mb-5 text-center">Sube archivos para expandir la memoria del bot.</p>

              {/* Paso 1: Seleccionar Pilar */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">¿A qué pilar pertenece este documento?</label>
                <select
                  value={selectedPilarId ?? ""}
                  onChange={(e) => setSelectedPilarId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599]/50"
                  disabled={isUploading}
                >
                  <option value="" className="bg-[#0F172A]">🌐 Global (visible para todos)</option>
                  <option value="1" className="bg-[#0F172A]">P1 — Administración General</option>
                  <option value="2" className="bg-[#0F172A]">P2 — Sistema Informático</option>
                  <option value="3" className="bg-[#0F172A]">P3 — Ventas y Tribus</option>
                  <option value="4" className="bg-[#0F172A]">P4 — Marketing y Comunicación</option>
                  <option value="5" className="bg-[#0F172A]">P5 — Legal y Control de Calidad</option>
                  <option value="6" className="bg-[#0F172A]">P6 — Contable y Finanzas</option>
                </select>
              </div>

              {/* Paso 2: Seleccionar Archivo */}
              <div
                className={`
                  relative rounded-xl border-2 border-dashed transition-all duration-300 p-6
                  flex flex-col items-center justify-center cursor-pointer
                  ${isUploading ? 'pointer-events-none opacity-50' : 'hover:border-[#00E599]/50 hover:bg-[#00E599]/5 border-white/10 bg-black/20'}
                  ${pendingFile ? 'border-[#00E599]/30 bg-[#00E599]/5' : ''}
                `}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setPendingFile(e.target.files[0]);
                      setUploadStatus({ type: null, message: '' });
                    }
                  }}
                />

                {isUploading ? (
                  <Loader2 className="w-10 h-10 text-[#00E599] animate-spin" />
                ) : pendingFile ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#00E599]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white truncate max-w-[250px]">{pendingFile.name}</p>
                      <p className="text-xs text-slate-400">{(pendingFile.size / 1024).toFixed(0)} KB — Click para cambiar</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-[#00E599] mb-3" />
                    <p className="text-sm font-medium text-slate-300">Click para seleccionar archivo</p>
                    <p className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT o MD</p>
                  </>
                )}
              </div>

              {/* Paso 3: Botón Subir */}
              {pendingFile && !isUploading && uploadStatus.type !== 'success' && (
                <button
                  onClick={() => handleFileUpload(pendingFile)}
                  className="w-full mt-4 py-3 rounded-xl bg-[#00E599] text-slate-900 font-bold text-sm hover:shadow-[0_0_30px_rgba(0,229,153,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Subir y Memorizar
                </button>
              )}

              {/* Estado del proceso */}
              {isUploading && uploadStatus.message && (
                <div className="mt-4 p-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-blue-500/10 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadStatus.message}
                </div>
              )}

              {/* Mensajes de Éxito/Error */}
              {!isUploading && uploadStatus.message && uploadStatus.type && (
                <div className={`mt-4 p-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${uploadStatus.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {uploadStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {uploadStatus.message}
                </div>
              )}

              {isUploading && (
                <p className="text-xs text-slate-500 mt-3 text-center animate-pulse">
                  Archivos grandes pueden tardar hasta 1 minuto. No cierres esta ventana.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar archivo */}
      {confirmDeleteFilename && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0A1628] border border-white/10 rounded-2xl p-6 max-w-sm w-[90%] shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">¿Eliminar archivo?</h3>
            <p className="text-slate-400 text-sm mb-1">
              Esta acción no se puede deshacer. Se borrarán permanentemente sus recuerdos asociados.
            </p>
            <p className="text-slate-500 text-xs mb-5 truncate">
              &ldquo;{confirmDeleteFilename}&rdquo;
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteFilename(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon, color, isText, sm }: any) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <h3 className={`${sm ? 'text-xl' : 'text-3xl'} font-bold mt-2 text-white`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  )
}

function getFileIconColor(type: string) {
  if (type.includes('pdf')) return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500' };
  if (type.includes('word') || type.includes('doc')) return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500' };
  return { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-500' };
}

function getFileFormatLabel(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'DOCX';
  if (mimeType.includes('spreadsheetml') || mimeType.includes('excel')) return 'XLSX';
  if (mimeType.includes('presentationml') || mimeType.includes('powerpoint')) return 'PPTX';
  if (mimeType.includes('plain')) return 'TXT';
  if (mimeType.includes('csv')) return 'CSV';
  if (mimeType.includes('json')) return 'JSON';
  if (mimeType.includes('html')) return 'HTML';
  // Fallback: try to get a short extension
  const parts = mimeType.split('/');
  const sub = parts[1] || '';
  if (sub.length <= 6) return sub.toUpperCase();
  return 'FILE';
}