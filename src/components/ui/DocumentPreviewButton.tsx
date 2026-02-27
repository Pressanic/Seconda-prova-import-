"use client";

import { useState } from "react";
import { X, ExternalLink, FileText, Download } from "lucide-react";

interface Props {
    url: string;
    nomeFile: string;
}

function detectType(nomeFile: string, url?: string): "pdf" | "image" | "unknown" {
    // Try from filename first, then fall back to URL path
    const src = nomeFile || url || "";
    const ext = src.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    return "unknown";
}

export default function DocumentPreviewButton({ url, nomeFile }: Props) {
    const [open, setOpen] = useState(false);
    const tipo = detectType(nomeFile, url);

    if (!url) return null;

    const noFile = url === "#";

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-xs text-blue-400 hover:text-blue-300 transition shrink-0"
            >
                Visualizza
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm"
                    onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
                >
                    {/* Barra superiore */}
                    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-900 border-b border-slate-700 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <p className="text-sm text-white font-medium truncate">{nomeFile || "Documento"}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            {!noFile && (
                                <>
                                    <a
                                        href={url}
                                        download={nomeFile}
                                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Scarica
                                    </a>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Apri
                                    </a>
                                </>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="text-slate-400 hover:text-white transition ml-1"
                                aria-label="Chiudi anteprima"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Area contenuto */}
                    <div className="flex-1 overflow-hidden flex items-stretch p-0">
                        {noFile && (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                                <FileText className="w-12 h-12 text-slate-600" />
                                <p className="text-slate-400 text-sm">File non caricato — sono stati salvati solo i metadati.</p>
                                <p className="text-slate-500 text-xs">Usa il pulsante "Aggiorna" per caricare il file.</p>
                            </div>
                        )}
                        {!noFile && tipo === "pdf" && (
                            <embed
                                src={url}
                                type="application/pdf"
                                className="w-full h-full"
                            />
                        )}
                        {!noFile && tipo === "image" && (
                            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={url}
                                    alt={nomeFile}
                                    className="max-w-full max-h-full object-contain rounded shadow-2xl"
                                />
                            </div>
                        )}
                        {!noFile && tipo === "unknown" && (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                                <FileText className="w-12 h-12 text-slate-600" />
                                <div>
                                    <p className="text-slate-300 text-sm font-medium">{nomeFile}</p>
                                    <p className="text-slate-500 text-xs mt-1">Anteprima non disponibile per questo formato.</p>
                                </div>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Apri il file
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
