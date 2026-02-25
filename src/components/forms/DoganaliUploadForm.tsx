"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Paperclip } from "lucide-react";
import { toast } from "@/hooks/useToast";

export default function DoganaliUploadForm({
    praticaId,
    tipoDocumento,
    existingId,
}: { praticaId: string; tipoDocumento: string; existingId?: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        codice_hs_nel_doc: "", valore_commerciale: "",
        valuta: "USD", peso_doc_kg: "", descrizione_merce_doc: "",
    });

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setUploadProgress(null);

        try {
            const file = fileRef.current?.files?.[0];
            let url_storage = "#";
            let nome_file = `${tipoDocumento}.pdf`;

            if (file) {
                setUploadProgress("Caricamento file...");
                const fd = new FormData();
                fd.append("file", file);
                const upRes = await fetch("/api/v1/upload", { method: "POST", body: fd });
                if (!upRes.ok) {
                    const err = await upRes.json();
                    throw new Error(err.error ?? "Errore upload file");
                }
                const uploaded = await upRes.json();
                url_storage = uploaded.url;
                nome_file = uploaded.nome_file;
            }

            setUploadProgress("Salvataggio...");
            const res = await fetch(`/api/v1/pratiche/${praticaId}/documenti-doganali`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tipo_documento: tipoDocumento,
                    nome_file,
                    url_storage,
                    codice_hs_nel_doc: form.codice_hs_nel_doc || null,
                    valore_commerciale: form.valore_commerciale || null,
                    valuta: form.valuta,
                    peso_doc_kg: form.peso_doc_kg || null,
                    descrizione_merce_doc: form.descrizione_merce_doc || null,
                    stato_validazione: "da_verificare",
                    anomalie_rilevate: [],
                }),
            });
            if (res.ok) {
                toast("Documento doganale caricato con successo", "success");
                setOpen(false);
                window.location.reload();
            } else {
                toast("Errore durante il salvataggio del documento", "error");
            }
        } catch (err: any) {
            toast(err.message ?? "Errore upload", "error");
            setUploadProgress(`Errore: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";

    if (!open) return (
        <button onClick={() => setOpen(true)}
            className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />{existingId ? "Aggiorna" : "Carica"}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md p-6">
                <h3 className="text-lg font-semibold text-white mb-5">Registra Documento Doganale</h3>
                <form onSubmit={handleSubmit} className="space-y-3">

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">File</label>
                        <div
                            className="flex items-center gap-2 border border-dashed border-slate-600 rounded-lg px-3 py-2.5 cursor-pointer hover:border-blue-500 transition"
                            onClick={() => fileRef.current?.click()}
                        >
                            <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs text-slate-400 truncate">
                                {fileName ?? "Seleziona file (PDF, JPG, PNG — max 10 MB)"}
                            </span>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => setFileName(e.target.files?.[0]?.name ?? null)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Codice HS nel Doc.</label>
                            <input value={form.codice_hs_nel_doc} onChange={e => setForm({ ...form, codice_hs_nel_doc: e.target.value })} placeholder="8477.80" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Peso (kg)</label>
                            <input type="number" value={form.peso_doc_kg} onChange={e => setForm({ ...form, peso_doc_kg: e.target.value })} placeholder="2800" className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Valore Commerciale</label>
                            <input type="number" value={form.valore_commerciale} onChange={e => setForm({ ...form, valore_commerciale: e.target.value })} placeholder="85000" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Valuta</label>
                            <select value={form.valuta} onChange={e => setForm({ ...form, valuta: e.target.value })} className={inputClass}>
                                <option>USD</option><option>EUR</option><option>CNY</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Descrizione Merce nel Doc.</label>
                        <textarea value={form.descrizione_merce_doc} onChange={e => setForm({ ...form, descrizione_merce_doc: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
                    </div>

                    {uploadProgress && (
                        <p className={`text-xs ${uploadProgress.startsWith("Errore") ? "text-red-400" : "text-blue-400"}`}>
                            {uploadProgress}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition">Annulla</button>
                        <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm transition flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salva"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
