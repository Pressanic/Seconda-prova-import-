"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ChevronDown } from "lucide-react";

interface Props {
    praticaId: string;
    initial: {
        eori_importatore: string;
        incoterms: string;
        porto_arrivo: string;
        spedizioniere: string;
        mrn_doganale: string;
    };
}

const INCOTERMS_OPTIONS = ["FOB", "CIF", "DAP", "DDP", "EXW", "CPT", "CFR"];

const inputClass = "w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export default function PraticaDoganaleForm({ praticaId, initial }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(initial);
    const [error, setError] = useState<string | null>(null);

    const set = (key: keyof typeof form, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/pratiche/${praticaId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eori_importatore: form.eori_importatore || null,
                    incoterms: form.incoterms || null,
                    porto_arrivo: form.porto_arrivo || null,
                    spedizioniere: form.spedizioniere || null,
                    mrn_doganale: form.mrn_doganale || null,
                }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Errore"); }
            setOpen(false);
            router.refresh();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="border-t border-slate-700/50 pt-4">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition"
            >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                {open ? "Chiudi" : "Modifica dati doganali"}
            </button>

            {open && (
                <div className="mt-4 space-y-4">
                    {error && (
                        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                EORI Importatore
                                <span className="text-orange-400 ml-1">*</span>
                            </label>
                            <input
                                value={form.eori_importatore}
                                onChange={e => set("eori_importatore", e.target.value)}
                                placeholder="es. IT12345678901"
                                className={inputClass}
                            />
                            <p className="text-xs text-slate-600 mt-0.5">Obbligatorio per sdoganamento UE</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Incoterms
                                <span className="text-orange-400 ml-1">*</span>
                            </label>
                            <select
                                value={form.incoterms}
                                onChange={e => set("incoterms", e.target.value)}
                                className={inputClass}
                            >
                                <option value="">— Seleziona —</option>
                                {INCOTERMS_OPTIONS.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-600 mt-0.5">Determina la base imponibile doganale</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Porto di Arrivo</label>
                            <input
                                value={form.porto_arrivo}
                                onChange={e => set("porto_arrivo", e.target.value)}
                                placeholder="es. Genova, Trieste, La Spezia"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Spedizioniere Doganale</label>
                            <input
                                value={form.spedizioniere}
                                onChange={e => set("spedizioniere", e.target.value)}
                                placeholder="Ragione sociale spedizioniere"
                                className={inputClass}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                MRN Doganale
                                <span className="text-slate-600 ml-1 font-normal">(dopo sdoganamento)</span>
                            </label>
                            <input
                                value={form.mrn_doganale}
                                onChange={e => set("mrn_doganale", e.target.value)}
                                placeholder="es. 24IT000123456789AB"
                                className={inputClass}
                            />
                            <p className="text-xs text-slate-600 mt-0.5">Numero generato dalla dogana italiana a sdoganamento completato</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Salva dati doganali
                    </button>
                </div>
            )}
        </div>
    );
}
