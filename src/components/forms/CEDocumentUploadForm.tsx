"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";

interface CEDocumentUploadFormProps {
    praticaId: string;
    macchinarioId: string;
    tipoDocumento: string;
    existingId?: string;
}

export default function CEDocumentUploadForm({
    praticaId,
    macchinarioId,
    tipoDocumento,
    existingId,
}: CEDocumentUploadFormProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        nome_file: "",
        normativa_citata: "",
        normativa_valida: true,
        firmato: false,
        mandatario_ue: "",
        data_documento: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`/api/v1/pratiche/${praticaId}/documenti-ce`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    macchinario_id: macchinarioId,
                    tipo_documento: tipoDocumento,
                    nome_file: form.nome_file || `${tipoDocumento}.pdf`,
                    url_storage: "#", // placeholder - no Vercel Blob in dev
                    normativa_citata: form.normativa_citata,
                    normativa_valida: form.normativa_valida,
                    firmato: form.firmato,
                    mandatario_ue: form.mandatario_ue || null,
                    data_documento: form.data_documento || null,
                    stato_validazione: form.normativa_valida && form.firmato ? "valido" : "attenzione",
                    anomalie_rilevate: [
                        ...(!form.normativa_valida ? [{ codice: "CE-NORM-001", messaggio: "Normativa obsoleta citata", severity: "alta" }] : []),
                        ...(!form.firmato ? [{ codice: "CE-FIELD-001", messaggio: "Firma mancante", severity: "media" }] : []),
                        ...(!form.mandatario_ue ? [{ codice: "CE-FIELD-003", messaggio: "Mandatario UE non indicato", severity: "alta" }] : []),
                    ],
                }),
            });
            if (res.ok) {
                setSuccess(true);
                setOpen(false);
                window.location.reload();
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg transition"
            >
                <Upload className="w-3.5 h-3.5" />
                {existingId ? "Aggiungi" : "Carica"}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md p-6">
                <h3 className="text-lg font-semibold text-white mb-5">Registra Documento CE</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1.5">Nome File</label>
                        <input
                            value={form.nome_file}
                            onChange={e => setForm({ ...form, nome_file: e.target.value })}
                            placeholder="dichiarazione_ce_macchina.pdf"
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1.5">Normativa Citata</label>
                        <input
                            value={form.normativa_citata}
                            onChange={e => setForm({ ...form, normativa_citata: e.target.value })}
                            placeholder="Reg. UE 2023/1230"
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1.5">Data Documento</label>
                        <input
                            type="date"
                            value={form.data_documento}
                            onChange={e => setForm({ ...form, data_documento: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1.5">Mandatario UE</label>
                        <input
                            value={form.mandatario_ue}
                            onChange={e => setForm({ ...form, mandatario_ue: e.target.value })}
                            placeholder="Ragione sociale mandatario..."
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.normativa_valida} onChange={e => setForm({ ...form, normativa_valida: e.target.checked })} className="accent-blue-500" />
                            <span className="text-sm text-slate-300">Normativa vigente</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.firmato} onChange={e => setForm({ ...form, firmato: e.target.checked })} className="accent-blue-500" />
                            <span className="text-sm text-slate-300">Documento firmato</span>
                        </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition">
                            Annulla
                        </button>
                        <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm transition flex items-center justify-center gap-2">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salva"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
