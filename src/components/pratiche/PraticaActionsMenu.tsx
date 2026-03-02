"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, ArrowUpRight, Trash2, AlertTriangle } from "lucide-react";

interface Props {
    id: string;
    codice: string;
}

export default function PraticaActionsMenu({ id, codice }: Props) {
    const [open, setOpen] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Chiudi cliccando fuori
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) {
                setOpen(false);
                setConfirm(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    async function doDelete() {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/pratiche/${id}`, { method: "DELETE" });
            if (res.ok) {
                router.refresh();
            }
        } finally {
            setLoading(false);
            setOpen(false);
            setConfirm(false);
        }
    }

    return (
        <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
            <button
                onClick={() => { setOpen(o => !o); setConfirm(false); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-700/50 transition-all duration-150"
                title="Azioni"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 top-9 w-48 glass-card py-1.5 z-50 shadow-2xl shadow-black/40">

                    {/* Apri pratica */}
                    <Link
                        href={`/pratiche/${id}`}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setOpen(false)}
                    >
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                        Apri pratica
                    </Link>

                    <div className="h-px bg-slate-700/60 my-1 mx-2" />

                    {/* Elimina — con conferma inline */}
                    {confirm ? (
                        <div className="px-3 py-2">
                            <p className="text-xs text-red-400 mb-2.5 flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                Eliminare {codice}?
                            </p>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={doDelete}
                                    disabled={loading}
                                    className="flex-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-400 disabled:opacity-60 py-1.5 rounded-md transition"
                                >
                                    {loading ? "…" : "Sì, elimina"}
                                </button>
                                <button
                                    onClick={() => setConfirm(false)}
                                    className="flex-1 text-xs text-slate-400 hover:text-slate-200 py-1.5 rounded-md border border-slate-700 hover:border-slate-600 transition"
                                >
                                    Annulla
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirm(true)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            Elimina pratica
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
