"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";

interface Props {
    id: string;
    codice: string;
    /** Se true, il pulsante non è nascosto fino all'hover (utile fuori da un contesto group) */
    alwaysVisible?: boolean;
}

export default function DeletePraticaButton({ id, codice, alwaysVisible }: Props) {
    const [confirm, setConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function doDelete() {
        setLoading(true);
        try {
            await fetch(`/api/v1/pratiche/${id}`, { method: "DELETE" });
            router.refresh();
        } finally {
            setLoading(false);
            setConfirm(false);
        }
    }

    if (confirm) {
        return (
            <div
                className="flex items-center gap-1.5 relative z-20"
                onClick={e => e.preventDefault()}
            >
                <span className="text-[11px] text-red-400 font-medium whitespace-nowrap">{codice}?</span>
                <button
                    onClick={doDelete}
                    disabled={loading}
                    className="text-[11px] font-semibold text-white bg-red-500 hover:bg-red-400 disabled:opacity-60 px-2 py-0.5 rounded transition"
                >
                    {loading ? "…" : "Elimina"}
                </button>
                <button
                    onClick={() => setConfirm(false)}
                    className="p-0.5 rounded text-slate-500 hover:text-slate-200 transition"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={e => { e.preventDefault(); setConfirm(true); }}
            title="Elimina pratica"
            className={`relative z-20 p-1.5 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 ${alwaysVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
            <Trash2 className="w-3.5 h-3.5" />
        </button>
    );
}
