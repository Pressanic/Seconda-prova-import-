"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Paperclip, Sparkles, X, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/useToast";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type DocumentCategory = "ce" | "doganale";

interface Props {
    category: DocumentCategory;
    tipoDocumento: string;
    tipoLabel: string;
    praticaId: string;
    macchinarioId?: string; // required for CE
    existingId?: string;
}

const inputClass = "w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";
const checkClass = "flex items-center gap-2 cursor-pointer";

// ─── TYPE-SPECIFIC FIELD CONFIG ─────────────────────────────────────────────

function CEFields({ tipo, form, setForm, extracted }: { tipo: string; form: Record<string, any>; setForm: (f: any) => void; extracted: Record<string, any> }) {
    const tag = (field: string) => extracted[field] ? <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded ml-1">AI</span> : null;
    const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

    if (tipo === "dichiarazione_ce") return (
        <div className="space-y-3">
            <div>
                <label className="block text-xs text-slate-300 mb-1">Normativa Citata {tag("normativa_citata")}</label>
                <input value={form.normativa_citata ?? ""} onChange={e => set("normativa_citata", e.target.value)} placeholder="Reg. UE 2023/1230" className={inputClass} />
            </div>
            <div>
                <label className="block text-xs text-slate-300 mb-1">Data Documento {tag("data_documento")}</label>
                <input type="date" value={form.data_documento ?? ""} onChange={e => set("data_documento", e.target.value)} className={inputClass} />
            </div>
            <div>
                <label className="block text-xs text-slate-300 mb-1">Mandatario UE {tag("mandatario_ue")}</label>
                <input value={form.mandatario_ue ?? ""} onChange={e => set("mandatario_ue", e.target.value)} placeholder="Ragione sociale..." className={inputClass} />
            </div>
            <div className="flex gap-5 pt-1">
                <label className={checkClass}><input type="checkbox" checked={!!form.normativa_valida} onChange={e => set("normativa_valida", e.target.checked)} className="accent-blue-500" /><span className="text-sm text-slate-300">Normativa vigente {tag("firmato")}</span></label>
                <label className={checkClass}><input type="checkbox" checked={!!form.firmato} onChange={e => set("firmato", e.target.checked)} className="accent-blue-500" /><span className="text-sm text-slate-300">Documento firmato {tag("firmato")}</span></label>
            </div>
        </div>
    );

    if (tipo === "manuale_uso") return (
        <div className="space-y-3">
            <div>
                <label className="block text-xs text-slate-300 mb-1">Lingua {tag("lingua")}</label>
                <select value={form.lingua ?? "Italiano"} onChange={e => set("lingua", e.target.value)} className={inputClass}>
                    <option>Italiano</option><option>Italiano + Inglese</option><option>Multilingua</option><option>Solo Inglese</option>
                </select>
                {form.lingua && form.lingua !== "Italiano" && form.lingua !== "Italiano + Inglese" && form.lingua !== "Multilingua" && (
                    <p className="text-xs text-yellow-400 mt-1">⚠ Manuale non disponibile in italiano — richiesto per il mercato UE</p>
                )}
            </div>
            <div><label className="block text-xs text-slate-300 mb-1">Versione {tag("versione")}</label><input value={form.versione ?? ""} onChange={e => set("versione", e.target.value)} placeholder="es. v1.2" className={inputClass} /></div>
            <div><label className="block text-xs text-slate-300 mb-1">Data Revisione {tag("data_revisione")}</label><input type="date" value={form.data_revisione ?? ""} onChange={e => set("data_revisione", e.target.value)} className={inputClass} /></div>
        </div>
    );

    if (tipo === "fascicolo_tecnico") return (
        <div className="space-y-3">
            <div><label className="block text-xs text-slate-300 mb-1">Data Compilazione {tag("data_compilazione")}</label><input type="date" value={form.data_compilazione ?? ""} onChange={e => set("data_compilazione", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs text-slate-300 mb-1">Responsabile Compilazione {tag("responsabile_compilazione")}</label><input value={form.responsabile_compilazione ?? ""} onChange={e => set("responsabile_compilazione", e.target.value)} placeholder="Nome e ruolo..." className={inputClass} /></div>
        </div>
    );

    if (tipo === "analisi_rischi") return (
        <div className="space-y-3">
            <div><label className="block text-xs text-slate-300 mb-1">Metodologia {tag("metodologia")}</label><input value={form.metodologia ?? "ISO 12100:2010"} onChange={e => set("metodologia", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs text-slate-300 mb-1">Data Valutazione {tag("data_valutazione")}</label><input type="date" value={form.data_valutazione ?? ""} onChange={e => set("data_valutazione", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs text-slate-300 mb-1">Firmatario {tag("firmatario")}</label><input value={form.firmatario ?? ""} onChange={e => set("firmatario", e.target.value)} placeholder="Nome responsabile..." className={inputClass} /></div>
        </div>
    );

    if (tipo === "schemi_elettrici") return (
        <div className="space-y-3">
            <div><label className="block text-xs text-slate-300 mb-1">Standard Citato {tag("standard_citato")}</label><input value={form.standard_citato ?? "CEI EN 60204-1"} onChange={e => set("standard_citato", e.target.value)} className={inputClass} />
                {form.standard_citato && !form.standard_citato.includes("60204") && <p className="text-xs text-yellow-400 mt-1">⚠ Verifica: lo standard atteso è CEI EN 60204-1</p>}
            </div>
            <div><label className="block text-xs text-slate-300 mb-1">Versione {tag("versione")}</label><input value={form.versione ?? ""} onChange={e => set("versione", e.target.value)} placeholder="es. Rev. 3" className={inputClass} /></div>
            <div><label className="block text-xs text-slate-300 mb-1">Data {tag("data_schemi")}</label><input type="date" value={form.data_schemi ?? ""} onChange={e => set("data_schemi", e.target.value)} className={inputClass} /></div>
        </div>
    );

    if (tipo === "certificazione_componente") {
        const scaduto = form.scadenza_certificato && new Date(form.scadenza_certificato) < new Date();
        return (
            <div className="space-y-3">
                <div><label className="block text-xs text-slate-300 mb-1">Componente {tag("componente")}</label><input value={form.componente ?? ""} onChange={e => set("componente", e.target.value)} placeholder="es. Centralina elettrica" className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Numero Certificato {tag("numero_certificato")}</label><input value={form.numero_certificato ?? ""} onChange={e => set("numero_certificato", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Ente Certificatore {tag("ente_certificatore")}</label><input value={form.ente_certificatore ?? ""} onChange={e => set("ente_certificatore", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Scadenza {tag("scadenza_certificato")}</label><input type="date" value={form.scadenza_certificato ?? ""} onChange={e => set("scadenza_certificato", e.target.value)} className={inputClass} />
                    {scaduto && <p className="text-xs text-red-400 mt-1">⚠ Certificato scaduto</p>}
                </div>
            </div>
        );
    }

    return <p className="text-xs text-slate-500">Nessun campo aggiuntivo per questo tipo di documento.</p>;
}

function DoganaliFields({ tipo, form, setForm, extracted }: { tipo: string; form: Record<string, any>; setForm: (f: any) => void; extracted: Record<string, any> }) {
    const tag = (field: string) => extracted[field] ? <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded ml-1">AI</span> : null;
    const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

    if (tipo === "bill_of_lading") return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">Numero BL {tag("numero_bl")}</label><input value={form.numero_bl ?? ""} onChange={e => set("numero_bl", e.target.value)} placeholder="MSKU123456789" className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Data BL {tag("data_bl")}</label><input type="date" value={form.data_bl ?? ""} onChange={e => set("data_bl", e.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">Porto Carico {tag("porto_carico")}</label><input value={form.porto_carico ?? ""} onChange={e => set("porto_carico", e.target.value)} placeholder="es. CNSHG" className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Porto Scarico {tag("porto_scarico")}</label><input value={form.porto_scarico ?? ""} onChange={e => set("porto_scarico", e.target.value)} placeholder="es. ITGOA" className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">Peso Lordo (kg) {tag("peso_doc_kg")}</label><input type="number" value={form.peso_doc_kg ?? ""} onChange={e => set("peso_doc_kg", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">N. Colli {tag("numero_colli")}</label><input type="number" value={form.numero_colli ?? ""} onChange={e => set("numero_colli", e.target.value)} className={inputClass} /></div>
            </div>
            <div><label className="block text-xs text-slate-300 mb-1">Codice HS nel Doc. {tag("codice_hs_nel_doc")}</label><input value={form.codice_hs_nel_doc ?? ""} onChange={e => set("codice_hs_nel_doc", e.target.value)} placeholder="es. 8477.80" className={inputClass} /></div>
        </div>
    );

    if (tipo === "fattura_commerciale") return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">N. Fattura {tag("numero_fattura")}</label><input value={form.numero_fattura ?? ""} onChange={e => set("numero_fattura", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Data Fattura {tag("data_fattura")}</label><input type="date" value={form.data_fattura ?? ""} onChange={e => set("data_fattura", e.target.value)} className={inputClass} /></div>
            </div>
            <div><label className="block text-xs text-slate-300 mb-1">Esportatore {tag("esportatore")}</label><input value={form.esportatore ?? ""} onChange={e => set("esportatore", e.target.value)} placeholder="Ragione sociale fornitore" className={inputClass} /></div>
            <div><label className="block text-xs text-slate-300 mb-1">Importatore {tag("importatore")}</label><input value={form.importatore ?? ""} onChange={e => set("importatore", e.target.value)} placeholder="Ragione sociale acquirente" className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">Valore Commerciale {tag("valore_commerciale")}</label><input type="number" value={form.valore_commerciale ?? ""} onChange={e => set("valore_commerciale", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Valuta {tag("valuta")}</label><select value={form.valuta ?? "USD"} onChange={e => set("valuta", e.target.value)} className={inputClass}><option>USD</option><option>EUR</option><option>CNY</option></select></div>
            </div>
            <div><label className="block text-xs text-slate-300 mb-1">Codice HS {tag("codice_hs_nel_doc")}</label><input value={form.codice_hs_nel_doc ?? ""} onChange={e => set("codice_hs_nel_doc", e.target.value)} placeholder="es. 8477.80" className={inputClass} /></div>
            <div><label className="block text-xs text-slate-300 mb-1">Descrizione Merce {tag("descrizione_merce_doc")}</label><textarea rows={2} value={form.descrizione_merce_doc ?? ""} onChange={e => set("descrizione_merce_doc", e.target.value)} className={`${inputClass} resize-none`} /></div>
        </div>
    );

    if (tipo === "packing_list") return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">N. Colli {tag("numero_colli")}</label><input type="number" value={form.numero_colli ?? ""} onChange={e => set("numero_colli", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Peso Lordo (kg) {tag("peso_doc_kg")}</label><input type="number" value={form.peso_doc_kg ?? ""} onChange={e => set("peso_doc_kg", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Peso Netto (kg) {tag("peso_netto_kg")}</label><input type="number" value={form.peso_netto_kg ?? ""} onChange={e => set("peso_netto_kg", e.target.value)} className={inputClass} /></div>
            </div>
            <div><label className="block text-xs text-slate-300 mb-1">Codice HS {tag("codice_hs_nel_doc")}</label><input value={form.codice_hs_nel_doc ?? ""} onChange={e => set("codice_hs_nel_doc", e.target.value)} placeholder="es. 8477.80" className={inputClass} /></div>
        </div>
    );

    if (tipo === "certificato_origine") return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">Paese Origine {tag("paese_origine")}</label><input value={form.paese_origine ?? "CN"} onChange={e => set("paese_origine", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">N. Certificato {tag("numero_certificato")}</label><input value={form.numero_certificato ?? ""} onChange={e => set("numero_certificato", e.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">Data {tag("data_certificato")}</label><input type="date" value={form.data_certificato ?? ""} onChange={e => set("data_certificato", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Ente Emittente {tag("ente_emittente")}</label><input value={form.ente_emittente ?? ""} onChange={e => set("ente_emittente", e.target.value)} className={inputClass} /></div>
            </div>
        </div>
    );

    if (tipo === "insurance_certificate") return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">N. Polizza {tag("numero_polizza")}</label><input value={form.numero_polizza ?? ""} onChange={e => set("numero_polizza", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Valuta {tag("valuta")}</label><select value={form.valuta ?? "USD"} onChange={e => set("valuta", e.target.value)} className={inputClass}><option>USD</option><option>EUR</option><option>CNY</option></select></div>
            </div>
            <div><label className="block text-xs text-slate-300 mb-1">Valore Assicurato {tag("valore_assicurato")}</label><input type="number" value={form.valore_assicurato ?? ""} onChange={e => set("valore_assicurato", e.target.value)} className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">Copertura Dal {tag("data_copertura_da")}</label><input type="date" value={form.data_copertura_da ?? ""} onChange={e => set("data_copertura_da", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Copertura Al {tag("data_copertura_a")}</label><input type="date" value={form.data_copertura_a ?? ""} onChange={e => set("data_copertura_a", e.target.value)} className={inputClass} /></div>
            </div>
        </div>
    );

    return null;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function DocumentUploadModal({ category, tipoDocumento, tipoLabel, praticaId, macchinarioId, existingId }: Props) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [progress, setProgress] = useState<string | null>(null);
    const [form, setForm] = useState<Record<string, any>>({});
    const [extracted, setExtracted] = useState<Record<string, any>>({});
    const fileRef = useRef<HTMLInputElement>(null);

    const reset = () => { setStep(1); setForm({}); setExtracted({}); setFileName(null); setProgress(null); };

    const handleAnalyze = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) { setStep(2); return; }
        setIsAnalyzing(true);
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(",")[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const res = await fetch("/api/v1/extract-document", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ file_base64: base64, mime_type: file.type, tipo_documento: tipoDocumento }),
            });
            const json = await res.json();
            if (json.campi_estratti && Object.keys(json.campi_estratti).length > 0) {
                setExtracted(json.campi_estratti);
                setForm(json.campi_estratti);
                toast("Dati estratti con successo — verifica e salva", "info");
            }
        } catch { /* silent — proceed to step 2 empty */ } finally {
            setIsAnalyzing(false);
            setStep(2);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setProgress(null);
        try {
            const file = fileRef.current?.files?.[0];
            let url_storage = "#";
            let nome_file = `${tipoDocumento}.pdf`;

            if (file) {
                setProgress("Caricamento file...");
                const fd = new FormData();
                fd.append("file", file);
                const upRes = await fetch("/api/v1/upload", { method: "POST", body: fd });
                if (!upRes.ok) { const err = await upRes.json(); throw new Error(err.error ?? "Errore upload"); }
                const uploaded = await upRes.json();
                url_storage = uploaded.url;
                nome_file = uploaded.nome_file;
            }

            setProgress("Salvataggio...");

            const extraData = { ...form };
            const dati_extra = Object.fromEntries(Object.entries(extraData).filter(([, v]) => v !== "" && v !== undefined && v !== null));

            if (category === "ce") {
                const res = await fetch(`/api/v1/pratiche/${praticaId}/documenti-ce`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        macchinario_id: macchinarioId,
                        tipo_documento: tipoDocumento,
                        nome_file, url_storage,
                        normativa_citata: form.normativa_citata || null,
                        normativa_valida: form.normativa_valida ?? true,
                        firmato: form.firmato ?? false,
                        mandatario_ue: form.mandatario_ue || null,
                        data_documento: form.data_documento || null,
                        stato_validazione: (form.normativa_valida !== false && form.firmato) ? "valido" : "attenzione",
                        anomalie_rilevate: [
                            ...(!form.normativa_valida ? [{ codice: "CE-NORM-001", messaggio: "Normativa non vigente", severity: "alta" }] : []),
                            ...(!form.firmato && tipoDocumento === "dichiarazione_ce" ? [{ codice: "CE-FIELD-001", messaggio: "Firma mancante", severity: "media" }] : []),
                            ...(tipoDocumento === "dichiarazione_ce" && !form.mandatario_ue ? [{ codice: "CE-FIELD-003", messaggio: "Mandatario UE non indicato", severity: "alta" }] : []),
                            { dati_extra },
                        ],
                    }),
                });
                if (!res.ok) throw new Error("Errore salvataggio CE");
            } else {
                const res = await fetch(`/api/v1/pratiche/${praticaId}/documenti-doganali`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tipo_documento: tipoDocumento,
                        nome_file, url_storage,
                        codice_hs_nel_doc: form.codice_hs_nel_doc || null,
                        valore_commerciale: form.valore_commerciale || null,
                        valuta: form.valuta || "USD",
                        peso_doc_kg: form.peso_doc_kg || null,
                        descrizione_merce_doc: form.descrizione_merce_doc || null,
                        stato_validazione: "da_verificare",
                        anomalie_rilevate: [{ dati_extra }],
                    }),
                });
                if (!res.ok) throw new Error("Errore salvataggio doganale");
            }

            toast(`${tipoLabel} caricato con successo`, "success");
            setOpen(false);
            reset();
            window.location.reload();
        } catch (err: any) {
            toast(err.message ?? "Errore", "error");
            setProgress(`Errore: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!open) return (
        <button onClick={() => { reset(); setOpen(true); }}
            className="flex items-center gap-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg transition">
            <Upload className="w-3.5 h-3.5" />
            {existingId ? "Aggiorna" : "Carica"}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        {step === 2 && <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white transition"><ArrowLeft className="w-4 h-4" /></button>}
                        <div>
                            <h3 className="text-base font-semibold text-white">{tipoLabel}</h3>
                            <p className="text-xs text-slate-500">Step {step} di 2 — {step === 1 ? "Seleziona file" : "Verifica dati"}</p>
                        </div>
                    </div>
                    <button onClick={() => { setOpen(false); reset(); }} className="text-slate-400 hover:text-white transition"><X className="w-4 h-4" /></button>
                </div>

                {/* Step 1 — File */}
                {step === 1 && (
                    <div className="p-6 space-y-4">
                        <div onClick={() => fileRef.current?.click()}
                            className="flex flex-col items-center gap-3 border-2 border-dashed border-slate-600 rounded-xl px-6 py-8 cursor-pointer hover:border-blue-500 transition group">
                            <Paperclip className="w-8 h-8 text-slate-500 group-hover:text-blue-400 transition" />
                            <div className="text-center">
                                <p className="text-sm text-slate-300">{fileName ?? "Clicca per selezionare il file"}</p>
                                <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG — max 10 MB</p>
                            </div>
                        </div>
                        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                            onChange={e => setFileName(e.target.files?.[0]?.name ?? null)} />

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => { setOpen(false); reset(); }}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm transition">
                                Annulla
                            </button>
                            {fileName ? (
                                <button type="button" onClick={handleAnalyze} disabled={isAnalyzing}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm transition">
                                    {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisi AI...</> : <><Sparkles className="w-4 h-4" /> Analizza e Continua</>}
                                </button>
                            ) : (
                                <button type="button" onClick={() => setStep(2)}
                                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2.5 rounded-lg text-sm transition">
                                    Compila manualmente →
                                </button>
                            )}
                        </div>

                        {Object.keys(extracted).length > 0 && (
                            <p className="text-xs text-blue-400 text-center">✓ Dati estratti in precedenza — clicca "Analizza" per aggiornare</p>
                        )}
                    </div>
                )}

                {/* Step 2 — Fields */}
                {step === 2 && (
                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        {Object.keys(extracted).length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <span>I campi con <span className="bg-blue-500/20 px-1 rounded">AI</span> sono stati auto-estratti dal documento — verifica prima di salvare</span>
                            </div>
                        )}
                        {!fileName && (
                            <p className="text-xs text-yellow-400">⚠ Nessun file selezionato — puoi salvare solo i metadati</p>
                        )}

                        {category === "ce"
                            ? <CEFields tipo={tipoDocumento} form={form} setForm={setForm} extracted={extracted} />
                            : <DoganaliFields tipo={tipoDocumento} form={form} setForm={setForm} extracted={extracted} />
                        }

                        {progress && (
                            <p className={`text-xs ${progress.startsWith("Errore") ? "text-red-400" : "text-blue-400"}`}>{progress}</p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setStep(1)}
                                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg text-sm transition">
                                <ArrowLeft className="w-3.5 h-3.5" /> Indietro
                            </button>
                            <button type="submit" disabled={isLoading}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm transition">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salva Documento"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
