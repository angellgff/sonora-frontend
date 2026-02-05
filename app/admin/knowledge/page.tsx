"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, RefreshCw, X, MessageSquare, LogOut, Download } from "lucide-react";
import Link from "next/link";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Función Borrar
  const handleDelete = async (filename: string) => {
    if (!confirm(`¿Estás SEGURO de eliminar "${filename}"?\nSe borrarán permanentemente sus recuerdos asociados.`)) return;

    try {
      const res = await fetch("/api/admin/knowledge-files", {
        method: "DELETE",
        body: JSON.stringify({ filename }),
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (data.success) {
        alert("Archivo eliminado correctamente");
        loadFiles(); // Recargar lista
      }
    } catch (error) {
      alert("Error eliminando archivo");
    }
  };

  // Funcion descargar
  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(`/api/admin/download-knowledge?filename=${encodeURIComponent(filename)}`);

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Error al descargar");
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
      alert("Error al descargar el archivo");
    }
  };

  // Importación dinámica para tokenizador (solo si no se usa arriba)
  // import { getEncoding } from "js-tiktoken";
  // OJO: js-tiktoken puede ser pesado en client, pero necesario para split exacto.
  // Alternativamente, usaremos un split simple por caracteres para el cliente y el backend re-verificará si es necesario

  // Función auxiliar para dividir texto
  const splitTextIntoChunks = (text: string, chunkSize = 1000) => {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    // Nota: El backend de OpenAI usa tokens, pero dividir por chars (aprox 4 chars = 1 token) es un proxy seguro
    // 1000 chars ~= 250 tokens. Es seguro.
    return chunks;
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    // Resetear stats
    let totalChunks = 0;
    let processedChunks = 0;

    try {
      // PASO 1: Extracción de Texto (Rápido)
      setUploadStatus({ type: null, message: 'Extrayendo texto del documento...' });

      const extractForm = new FormData();
      extractForm.append("file", file);

      const extractRes = await fetch("/api/admin/extract-text", { method: "POST", body: extractForm });
      const extractData = await extractRes.json();

      if (!extractRes.ok) throw new Error(extractData.error || "Error extrayendo texto");

      const text = extractData.text;
      if (!text || text.length === 0) throw new Error("Archivo subido pero sin texto legible");

      // PASO 2: Chunking en Cliente
      setUploadStatus({ type: null, message: 'Dividiendo información...' });
      const chunks = splitTextIntoChunks(text, 2000); // 2000 caracteres por chunk (~500 tokens)
      totalChunks = chunks.length;

      // PASO 3: Subida por Lotes (Batch Upload)
      // Enviaremos lotes de 50 chunks a la vez
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
          storagePath: `${Date.now()}_${file.name}`, // Path simple
          startIndex: i
        };

        const saveRes = await fetch("/api/admin/save-chunks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveBody)
        });

        if (!saveRes.ok) {
          const errorData = await saveRes.json();
          throw new Error(`Error en lote ${i}: ${errorData.error}`);
        }

        processedChunks += batch.length;
      }

      setUploadStatus({ type: 'success', message: `¡Éxito! ${processedChunks} fragmentos aprendidos.` });
      setTimeout(() => {
        setIsUploadModalOpen(false);
        loadFiles();
        setUploadStatus({ type: null, message: '' });
      }, 2000);

    } catch (error: any) {
      console.error(error);
      setUploadStatus({ type: 'error', message: error.message || "Error desconocido" });
    } finally {
      setIsUploading(false);
    }
  };

  // -- Componente Visual --
  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans selection:bg-[#00E599] selection:text-black relative overflow-x-hidden">

      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Nav */}
      <nav className="relative z-50 w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#00E599] shadow-[0_0_10px_#00E599]"></span>
          <span className="text-sm font-semibold tracking-wide uppercase text-slate-400">Panel Administrativo</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">BS</div>
      </nav>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mt-8 mb-20">

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
            {/* Botón Salir al Dashboard */}
            <Link href="/dashboard" className="flex items-center justify-center px-3 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-medium text-slate-400" title="Ir a Dashboard Usuario">
              <LogOut className="w-4 h-4" />
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
          <div className="grid grid-cols-12 gap-4 p-5 border-b border-white/5 bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <div className="col-span-5 md:col-span-6 pl-2">Nombre del Archivo</div>
            <div className="col-span-3 md:col-span-2 text-center">Formato</div>
            <div className="col-span-2 md:col-span-2 text-right">Creado</div>
            <div className="col-span-2 md:col-span-2 text-right pr-2">Acciones</div>
          </div>

          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Cargando memoria...</div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No hay documentos en memoria aún.</div>
            ) : (
              files.map((file, idx) => (
                <div key={idx} className="group grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors">
                  {/* Nombre */}
                  <div className="col-span-5 md:col-span-6 flex items-center gap-4 pl-2">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border ${getFileIconColor(file.type).bg} ${getFileIconColor(file.type).border}`}>
                      <FileText className={`w-5 h-5 ${getFileIconColor(file.type).text}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-[#00E599] transition-colors">{file.name}</p>
                      <p className="text-xs text-slate-500">{file.chunks} chunks</p>
                    </div>
                  </div>
                  {/* Tipo */}
                  <div className="col-span-3 md:col-span-2 flex justify-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-slate-300">
                      {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </span>
                  </div>
                  {/* Fecha */}
                  <div className="col-span-2 md:col-span-2 text-right text-sm text-slate-400">
                    {new Date(file.created_at).toLocaleDateString()}
                  </div>
                  {/* Acciones */}
                  <div className="col-span-2 md:col-span-2 flex justify-end pr-2">
                    <button
                      onClick={() => handleDownload(file.name)}
                      className="p-2 rounded-lg text-slate-400 hover:text-[#00E599]/10 hover:bg-[#00E599]/10 transition-all"
                      title="Descargar archivo"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.name)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Eliminar memoria"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* MODAL DE CARGA (Overlay) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X /></button>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Añadir Conocimiento</h2>
              <p className="text-slate-400 text-sm mb-6">Sube archivos para expandir la memoria del bot.</p>

              {/* ZONA DE CARGA REUTILIZADA */}
              <div
                className={`
                      relative rounded-xl border-2 border-dashed transition-all duration-300 p-10
                      flex flex-col items-center justify-center cursor-pointer
                      ${isUploading ? 'pointer-events-none opacity-50' : 'hover:border-[#00E599]/50 hover:bg-[#00E599]/5 border-white/10 bg-black/20'}
                    `}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

                {isUploading ? (
                  <Loader2 className="w-12 h-12 text-[#00E599] animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 text-[#00E599] mb-4" />
                )}
                <p className="text-sm font-medium text-slate-300 mt-2">
                  {isUploading ? "Memorizando documento..." : "Click para seleccionar"}
                </p>
                {isUploading && (
                  <p className="text-xs text-slate-500 mt-2 animate-pulse">
                    Archivos grandes pueden tardar hasta 1 minuto. No cierres esta ventana.
                  </p>
                )}
              </div>

              {/* Mensajes de Estado */}
              {uploadStatus.message && (
                <div className={`mt-4 p-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${uploadStatus.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                  {uploadStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {uploadStatus.message}
                </div>
              )}
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