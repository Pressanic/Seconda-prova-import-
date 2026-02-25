"use client";

import { useState } from "react";
import { Search, CheckCircle, AlertTriangle, Percent } from "lucide-react";
import type { HSResult } from "@/lib/services/hs-classifier";

interface HSClassificationWidgetProps {
    praticaId: string;
    macchinarioId: string;
    initialDescription?: string;
    initialFunction?: string;
    selectedCode?: string | null;
}

export default function HSClassificationWidget({
    praticaId,
    macchinarioId,
    initialDescription = "",
    initialFunction = "",
    selectedCode,
}: HSClassificationWidgetProps) {
    const [query, setQuery] = useState(initialDescription);
    const [results, setResults] = useState<HSResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<HSResult | null>(null);
    const [saved, setSaved] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/pratiche/${praticaId}/hs-suggestions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ descrizione: query, funzione: initialFunction }),
            });
            const data = await res.json();
            setResults(data.results ?? []);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (result: HSResult) => {
        setSelected(result);
        // Save to macchinario
        await fetch(`/api/v1/pratiche/${praticaId}/hs-classification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                macchinario_id: macchinarioId,
                codice_hs: result.hs_code,
                codice_taric: result.taric_code,
                descrizione_hs: result.descrizione,
                dazio_percentuale: result.dazio_pct,
                iva_applicabile: result.iva_pct,
                misure_restrittive: result.misure_restrittive,
            }),
        });
        setSaved(true);
    };

    const getConfidenceColor = (c: number) =>
        c >= 70 ? "text-green-400 bg-green-500/10" : c >= 40 ? "text-yellow-400 bg-yellow-500/10" : "text-red-400 bg-red-500/10";

    return (
        <div className="space-y-5">
            {/* Search */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-400" /> Classificazione Automatica HS
                </h3>
                <textarea
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Descrivi il macchinario: es. 'pressa a iniezione per materie plastiche, 4600 kN, sistema idraulico'"
                    rows={3}
                    className="w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="mt-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                    {loading ? "Classificando..." : <><Search className="w-4 h-4" /> Classifica HS</>}
                </button>
            </div>

            {/* Results */}
            {results.length > 0 && (
                <div className="glass-card overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-700">
                        <p className="text-sm font-semibold text-white">Suggerimenti HS — {results.length} risultati</p>
                    </div>
                    <div className="divide-y divide-slate-700/40">
                        {results.map((r) => (
                            <div key={r.taric_code}
                                className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition hover:bg-slate-800/40 ${selected?.taric_code === r.taric_code ? "bg-blue-600/10 border-l-2 border-blue-500" : ""}`}
                                onClick={() => handleSelect(r)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <code className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{r.hs_code}</code>
                                        <code className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">{r.taric_code}</code>
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 ${getConfidenceColor(r.confidence)}`}>
                                            <Percent className="w-3 h-3" />{r.confidence}% match
                                        </span>
                                    </div>
                                    <p className="text-sm text-white mt-1.5">{r.descrizione}</p>
                                    <div className="flex gap-4 mt-1.5 text-xs text-slate-400">
                                        <span>Dazio: <strong className="text-white">{r.dazio_pct}%</strong></span>
                                        <span>IVA: <strong className="text-white">{r.iva_pct}%</strong></span>
                                    </div>
                                    {r.misure_restrittive.length > 0 && (
                                        <div className="mt-2">
                                            {r.misure_restrittive.map((m, i) => (
                                                <div key={i} className="flex items-center gap-1.5 text-xs text-yellow-400">
                                                    <AlertTriangle className="w-3 h-3" /> {m.descrizione}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selected?.taric_code === r.taric_code && (
                                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-1" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {saved && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Codice HS/TARIC selezionato e salvato
                </div>
            )}
        </div>
    );
}
