"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Upload, Loader2, Paperclip, Sparkles, X, ArrowLeft, Eye } from "lucide-react";
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
    existingDoc?: Record<string, any>; // pre-fill form in update mode
    componenteId?: string; // set when the CE doc belongs to a specific component
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
                <label className="block text-xs text-slate-300 mb-1">Normativa Citata (Direttiva UE) {tag("normativa_citata")}</label>
                <input value={form.normativa_citata ?? ""} onChange={e => set("normativa_citata", e.target.value)} placeholder="Dir. 2006/42/CE" className={inputClass} />
            </div>
            <div>
                <label className="block text-xs text-slate-300 mb-1">Data Documento {tag("data_documento")}</label>
                <input type="date" value={form.data_documento ?? ""} onChange={e => set("data_documento", e.target.value)} className={inputClass} />
            </div>
            <div>
                <label className="block text-xs text-slate-300 mb-1">Mandatario UE {tag("mandatario_ue")}</label>
                <input value={form.mandatario_ue ?? ""} onChange={e => set("mandatario_ue", e.target.value)} placeholder="Ragione sociale..." className={inputClass} />
            </div>
            {/* Normativa vigente — pannello informativo */}
            <div className={`rounded-lg border p-3 ${form.normativa_valida ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={!!form.normativa_valida} onChange={e => set("normativa_valida", e.target.checked)} className="accent-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-slate-200 font-medium">Direttiva/regolamento in vigore</span>
                            {tag("normativa_valida")}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${form.normativa_valida ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                {form.normativa_valida ? "✓ Vigente" : "✗ Obsoleta / non applicabile"}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            {form.normativa_citata
                                ? <>La normativa citata <span className="text-slate-300 font-medium">{form.normativa_citata}</span> è attualmente applicabile in UE</>
                                : "Indica se la direttiva o il regolamento citato nel documento è attualmente in vigore"}
                        </p>
                        {!form.normativa_valida && (
                            <p className="text-[11px] text-orange-400 mt-1.5">⚠ Genera anomalia CE-NORM-001 — penalità −20 punti sul risk score</p>
                        )}
                    </div>
                </label>
            </div>
            <label className={checkClass}><input type="checkbox" checked={!!form.firmato} onChange={e => set("firmato", e.target.checked)} className="accent-blue-500" /><span className="text-sm text-slate-300">Documento firmato {tag("firmato")}</span></label>
        </div>
    );

    if (tipo === "manuale_uso") {
        const hasItalian = !form.lingua || ["Italiano", "Italiano + Inglese", "Multilingua"].includes(form.lingua);
        return (
            <div className="space-y-3">
                <div>
                    <label className="block text-xs text-slate-300 mb-1">Lingua principale {tag("lingua")}</label>
                    <select value={form.lingua ?? "Italiano"} onChange={e => set("lingua", e.target.value)} className={inputClass}>
                        <option>Italiano</option><option>Italiano + Inglese</option><option>Multilingua</option><option>Solo Inglese</option><option>Solo Cinese</option><option>Altra lingua</option>
                    </select>
                    {!hasItalian && (
                        <p className="text-xs text-red-400 mt-1">⚠ Manuale non in italiano — non ammesso per il mercato UE (Dir. 2006/42/CE Art. 10)</p>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-slate-300 mb-1">Versione {tag("versione")}</label><input value={form.versione ?? ""} onChange={e => set("versione", e.target.value)} placeholder="es. v1.2" className={inputClass} /></div>
                    <div><label className="block text-xs text-slate-300 mb-1">Data Revisione {tag("data_revisione")}</label><input type="date" value={form.data_revisione ?? ""} onChange={e => set("data_revisione", e.target.value)} className={inputClass} /></div>
                </div>
                {/* Sezioni obbligatorie (Dir. 2006/42/CE All. I § 1.7.4.2) */}
                <div className="rounded-lg border border-slate-700 p-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sezioni obbligatorie {tag("ha_sezione_installazione")}</p>
                    <p className="text-[11px] text-slate-500">Verifica la presenza delle sezioni richieste da All. I § 1.7.4.2</p>
                    <label className={checkClass}><input type="checkbox" checked={!!form.ha_sezione_installazione} onChange={e => set("ha_sezione_installazione", e.target.checked)} className="accent-blue-500" /><span className="text-sm text-slate-300">Installazione e messa in servizio</span>{!form.ha_sezione_installazione && <span className="text-[10px] text-orange-400 ml-1">−10 pts</span>}</label>
                    <label className={checkClass}><input type="checkbox" checked={!!form.ha_sezione_uso_normale} onChange={e => set("ha_sezione_uso_normale", e.target.checked)} className="accent-blue-500" /><span className="text-sm text-slate-300">Uso normale e sicuro</span>{!form.ha_sezione_uso_normale && <span className="text-[10px] text-red-400 ml-1">−15 pts</span>}</label>
                    <label className={checkClass}><input type="checkbox" checked={!!form.ha_sezione_manutenzione} onChange={e => set("ha_sezione_manutenzione", e.target.checked)} className="accent-blue-500" /><span className="text-sm text-slate-300">Manutenzione e ispezioni</span>{!form.ha_sezione_manutenzione && <span className="text-[10px] text-orange-400 ml-1">−10 pts</span>}</label>
                </div>
            </div>
        );
    }

    if (tipo === "fascicolo_tecnico") return (
        <div className="space-y-3">
            {/* Dati principali */}
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">Data Compilazione {tag("data_compilazione")}</label><input type="date" value={form.data_compilazione ?? ""} onChange={e => set("data_compilazione", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Responsabile {tag("responsabile_compilazione")}</label><input value={form.responsabile_compilazione ?? ""} onChange={e => set("responsabile_compilazione", e.target.value)} placeholder="Nome e ruolo" className={inputClass} /></div>
            </div>

            {/* Analisi dei Rischi */}
            <div className={`rounded-lg border p-3 space-y-2 transition-colors ${form.contiene_analisi_rischi ? "border-green-500/30 bg-green-500/5" : "border-slate-700"}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form.contiene_analisi_rischi} onChange={e => set("contiene_analisi_rischi", e.target.checked)} className="accent-blue-500" />
                    <span className="text-sm font-medium text-slate-200">Analisi dei Rischi inclusa {tag("contiene_analisi_rischi")}</span>
                    <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Obbligatoria</span>
                </label>
                {form.contiene_analisi_rischi && (
                    <div className="pl-5 grid grid-cols-2 gap-2 pt-1">
                        <div><label className="block text-[11px] text-slate-400 mb-1">Metodologia {tag("ar_metodologia")}</label><input value={form.ar_metodologia ?? "ISO 12100:2010"} onChange={e => set("ar_metodologia", e.target.value)} className={inputClass} /></div>
                        <div><label className="block text-[11px] text-slate-400 mb-1">Data valutazione {tag("ar_data")}</label><input type="date" value={form.ar_data ?? ""} onChange={e => set("ar_data", e.target.value)} className={inputClass} /></div>
                        <div className="col-span-2"><label className="block text-[11px] text-slate-400 mb-1">Firmatario {tag("ar_firmatario")}</label><input value={form.ar_firmatario ?? ""} onChange={e => set("ar_firmatario", e.target.value)} placeholder="Nome responsabile" className={inputClass} /></div>
                    </div>
                )}
                {!form.contiene_analisi_rischi && <p className="text-[11px] text-orange-400 pl-5">⚠ Obbligatoria per Dir. 2006/42/CE (ISO 12100:2010) — genera anomalia CE-FT-001</p>}
            </div>

            {/* Schemi Elettrici */}
            <div className={`rounded-lg border p-3 space-y-2 transition-colors ${form.contiene_schemi_elettrici ? "border-green-500/30 bg-green-500/5" : "border-slate-700"}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form.contiene_schemi_elettrici} onChange={e => set("contiene_schemi_elettrici", e.target.checked)} className="accent-blue-500" />
                    <span className="text-sm font-medium text-slate-200">Schemi Elettrici inclusi {tag("contiene_schemi_elettrici")}</span>
                    <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Obbligatori</span>
                </label>
                {form.contiene_schemi_elettrici && (
                    <div className="pl-5 grid grid-cols-3 gap-2 pt-1">
                        <div className="col-span-2"><label className="block text-[11px] text-slate-400 mb-1">Standard {tag("schemi_standard")}</label><input value={form.schemi_standard ?? "CEI EN 60204-1"} onChange={e => set("schemi_standard", e.target.value)} className={inputClass} /></div>
                        <div><label className="block text-[11px] text-slate-400 mb-1">Revisione {tag("schemi_versione")}</label><input value={form.schemi_versione ?? ""} onChange={e => set("schemi_versione", e.target.value)} placeholder="Rev. 3" className={inputClass} /></div>
                        <div><label className="block text-[11px] text-slate-400 mb-1">Data {tag("schemi_data")}</label><input type="date" value={form.schemi_data ?? ""} onChange={e => set("schemi_data", e.target.value)} className={inputClass} /></div>
                    </div>
                )}
                {!form.contiene_schemi_elettrici && <p className="text-[11px] text-orange-400 pl-5">⚠ Obbligatori per CEI EN 60204-1 — genera anomalia CE-FT-002</p>}
            </div>

            {/* Schemi Idraulici (condizionale) */}
            <div className={`rounded-lg border p-3 space-y-2 transition-colors ${form.contiene_schemi_idraulici ? "border-blue-500/30 bg-blue-500/5" : "border-slate-700/50"}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form.contiene_schemi_idraulici} onChange={e => set("contiene_schemi_idraulici", e.target.checked)} className="accent-blue-500" />
                    <span className="text-sm text-slate-300">Schemi Idraulici inclusi {tag("contiene_schemi_idraulici")}</span>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Per azionamento idraulico/ibrido</span>
                </label>
                {form.contiene_schemi_idraulici && (
                    <div className="pl-5 pt-1">
                        <label className="block text-[11px] text-slate-400 mb-1">Data schemi idraulici</label>
                        <input type="date" value={form.schemi_idraulici_data ?? ""} onChange={e => set("schemi_idraulici_data", e.target.value)} className={inputClass} />
                    </div>
                )}
            </div>

            {/* Schemi Pneumatici (condizionale) */}
            <div className={`rounded-lg border p-3 space-y-2 transition-colors ${form.contiene_schemi_pneumatici ? "border-blue-500/30 bg-blue-500/5" : "border-slate-700/50"}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form.contiene_schemi_pneumatici} onChange={e => set("contiene_schemi_pneumatici", e.target.checked)} className="accent-blue-500" />
                    <span className="text-sm text-slate-300">Schemi Pneumatici inclusi {tag("contiene_schemi_pneumatici")}</span>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Se presenti sistemi pneumatici ausiliari</span>
                </label>
                {form.contiene_schemi_pneumatici && (
                    <div className="pl-5 pt-1">
                        <label className="block text-[11px] text-slate-400 mb-1">Data schemi pneumatici</label>
                        <input type="date" value={form.schemi_pneumatici_data ?? ""} onChange={e => set("schemi_pneumatici_data", e.target.value)} className={inputClass} />
                    </div>
                )}
            </div>
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
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">Incoterms nel Doc. {tag("incoterms_doc")}</label>
                    <select value={form.incoterms_doc ?? ""} onChange={e => set("incoterms_doc", e.target.value)} className={inputClass}>
                        <option value="">— seleziona —</option>
                        <option>FOB</option><option>CIF</option><option>DAP</option><option>DDP</option><option>EXW</option><option>CFR</option><option>FCA</option>
                    </select>
                </div>
                <div><label className="block text-xs text-slate-300 mb-1">Codice HS nel Doc. {tag("codice_hs_nel_doc")}</label><input value={form.codice_hs_nel_doc ?? ""} onChange={e => set("codice_hs_nel_doc", e.target.value)} placeholder="es. 8477.80" className={inputClass} /></div>
            </div>
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
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-300 mb-1">Codice HS {tag("codice_hs_nel_doc")}</label><input value={form.codice_hs_nel_doc ?? ""} onChange={e => set("codice_hs_nel_doc", e.target.value)} placeholder="es. 8477.80" className={inputClass} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Incoterms nel Doc. {tag("incoterms_doc")}</label>
                    <select value={form.incoterms_doc ?? ""} onChange={e => set("incoterms_doc", e.target.value)} className={inputClass}>
                        <option value="">— seleziona —</option>
                        <option>FOB</option><option>CIF</option><option>DAP</option><option>DDP</option><option>EXW</option><option>CFR</option><option>FCA</option>
                    </select>
                </div>
            </div>
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

// ─── DATE NORMALIZATION ──────────────────────────────────────────────────────

const DATE_FIELDS = new Set([
    "data_documento", "data_revisione", "data_compilazione", "data_valutazione",
    "data_schemi", "scadenza_certificato", "data_bl", "data_fattura",
    "data_certificato", "data_copertura_da", "data_copertura_a",
    "ar_data", "schemi_data", "schemi_idraulici_data", "schemi_pneumatici_data",
]);

function normalizeDate(value: any): string {
    if (!value || typeof value !== "string") return "";
    const v = value.trim();

    // Already YYYY-MM-DD: validate month/day ranges
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const [, m, d] = v.split("-").map(Number);
        return (m >= 1 && m <= 12 && d >= 1 && d <= 31) ? v : "";
    }

    // DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY  (and MM/DD/YYYY fallback)
    const dmy = v.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})$/);
    if (dmy) {
        const a = parseInt(dmy[1]), b = parseInt(dmy[2]), y = dmy[3];
        // Prefer DD/MM/YYYY (Italian convention) when b is a valid month
        if (b >= 1 && b <= 12 && a >= 1 && a <= 31)
            return `${y}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
        // Fallback to MM/DD/YYYY (American) when a is a valid month
        if (a >= 1 && a <= 12 && b >= 1 && b <= 31)
            return `${y}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`;
        return "";
    }

    // YYYY/MM/DD or YYYY.MM.DD
    const ymd = v.match(/^(\d{4})[\/\.](\d{1,2})[\/\.](\d{1,2})$/);
    if (ymd) {
        const m = parseInt(ymd[2]), d = parseInt(ymd[3]);
        return (m >= 1 && m <= 12 && d >= 1 && d <= 31)
            ? `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}` : "";
    }

    // Fallback: let Date parse it (handles "January 5, 2024", etc.)
    const parsed = new Date(v);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
    return "";
}

function normalizeExtracted(fields: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
        Object.entries(fields).map(([k, v]) => [k, DATE_FIELDS.has(k) ? normalizeDate(v) : v])
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function DocumentUploadModal({ category, tipoDocumento, tipoLabel, praticaId, macchinarioId, existingId, existingDoc, componenteId }: Props) {
    const isUpdate = !!existingId;

    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [progress, setProgress] = useState<string | null>(null);
    const [form, setForm] = useState<Record<string, any>>({});
    const [extracted, setExtracted] = useState<Record<string, any>>({});
    const [aiAnomalies, setAiAnomalies] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => setMounted(true), []);

    const reset = () => {
        if (isUpdate && existingDoc) {
            // In update mode: pre-fill with existing data, skip to step 2
            const prefilled = normalizeExtracted({ ...existingDoc });
            setForm(prefilled);
            setExtracted({});
            setAiAnomalies([]);
            setFileName(existingDoc.nome_file ?? null);
            setSelectedFile(null);
            setStep(2);
        } else {
            setStep(1);
            setForm({});
            setExtracted({});
            setAiAnomalies([]);
            setFileName(null);
            setSelectedFile(null);
        }
        setProgress(null);
    };

    const handleAnalyze = async () => {
        const file = selectedFile;
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
                // Separate AI-internal fields from form fields
                const { anomalie, tipo_documento_verificato, tipo_documento_rilevato, lingue_presenti, lingua_italiana_presente, ...formFields } = json.campi_estratti;

                // Store AI-detected anomalies
                if (Array.isArray(anomalie) && anomalie.length > 0) {
                    setAiAnomalies(anomalie);
                }

                // Warn if document type is wrong
                if (tipo_documento_verificato === "altro") {
                    toast(`Documento non corretto: l'AI ha rilevato "${tipo_documento_rilevato ?? "tipo sconosciuto"}" — verifica il file caricato`, "error");
                } else if (Array.isArray(anomalie) && anomalie.length > 0) {
                    toast(`Dati estratti — ${anomalie.length} problema/i rilevato/i dall'AI, verificali prima di salvare`, "info");
                } else {
                    toast("Dati estratti con successo — verifica e salva", "info");
                }

                const normalized = normalizeExtracted(formFields);
                setExtracted(normalized);
                setForm(normalized);
            }
        } catch (err: any) {
            const msg = err?.message ?? "Errore analisi AI";
            toast(`Analisi AI non riuscita — compila i campi manualmente (${msg})`, "error");
        } finally {
            setIsAnalyzing(false);
            setStep(2);
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setProgress(null);
        try {
            const file = selectedFile;
            // In update mode with no new file: keep existing url/nome
            let url_storage = isUpdate ? (existingDoc?.url_storage ?? "#") : "#";
            let nome_file = isUpdate ? (existingDoc?.nome_file ?? `${tipoDocumento}.pdf`) : `${tipoDocumento}.pdf`;

            if (file) {
                setProgress("Caricamento file...");
                const upRes = await fetch("/api/v1/upload", {
                    method: "POST",
                    headers: {
                        "Content-Type": file.type,
                        "x-file-type": file.type,
                        "x-file-name": encodeURIComponent(file.name),
                    },
                    body: file,
                    // @ts-ignore — duplex needed for streaming in some runtimes
                    duplex: "half",
                });
                if (!upRes.ok) {
                    const err = await upRes.json().catch(() => ({}));
                    throw new Error(err.error ?? err.message ?? "Errore upload file");
                }
                const uploaded = await upRes.json();
                url_storage = uploaded.url;
                nome_file = uploaded.nome_file;
            }

            setProgress("Salvataggio...");

            const extraData = { ...form };
            const dati_extra = Object.fromEntries(Object.entries(extraData).filter(([, v]) => v !== "" && v !== undefined && v !== null));

            if (category === "ce") {
                const method = isUpdate ? "PATCH" : "POST";
                const url = isUpdate
                    ? `/api/v1/pratiche/${praticaId}/documenti-ce/${existingId}`
                    : `/api/v1/pratiche/${praticaId}/documenti-ce`;

                // Build anomalie and stato_validazione based on document type
                const anomalie: any[] = [...aiAnomalies];
                let stato_validazione = "da_verificare";

                if (tipoDocumento === "dichiarazione_ce" || tipoDocumento === "certificazione_componente") {
                    if (!form.normativa_valida) anomalie.push({ codice: "CE-NORM-001", messaggio: "Normativa non vigente", severity: "alta" });
                    if (!form.firmato) anomalie.push({ codice: "CE-FIELD-001", messaggio: "Firma mancante", severity: "media" });
                    if (tipoDocumento === "dichiarazione_ce" && !form.mandatario_ue) anomalie.push({ codice: "CE-FIELD-003", messaggio: "Mandatario UE non indicato", severity: "alta" });
                    stato_validazione = (form.normativa_valida !== false && form.firmato) ? "valido" : "attenzione";

                } else if (tipoDocumento === "fascicolo_tecnico") {
                    if (!form.contiene_analisi_rischi) anomalie.push({ codice: "CE-FT-001", messaggio: "Analisi dei rischi assente nel fascicolo", severity: "alta" });
                    if (!form.contiene_schemi_elettrici) anomalie.push({ codice: "CE-FT-002", messaggio: "Schemi elettrici assenti nel fascicolo", severity: "alta" });
                    stato_validazione = (form.contiene_analisi_rischi && form.contiene_schemi_elettrici) ? "valido" : "attenzione";

                } else if (tipoDocumento === "manuale_uso") {
                    const hasItalian = !form.lingua || ["Italiano", "Italiano + Inglese", "Multilingua"].includes(form.lingua);
                    if (!hasItalian) anomalie.push({ codice: "CE-MAN-001", messaggio: `Manuale non in italiano (${form.lingua})`, severity: "alta" });
                    if (!form.ha_sezione_installazione) anomalie.push({ codice: "CE-MAN-002", messaggio: "Sezione installazione mancante (All. I § 1.7.4.2)", severity: "media" });
                    if (!form.ha_sezione_uso_normale) anomalie.push({ codice: "CE-MAN-004", messaggio: "Sezione uso normale mancante (All. I § 1.7.4.2)", severity: "alta" });
                    if (!form.ha_sezione_manutenzione) anomalie.push({ codice: "CE-MAN-003", messaggio: "Sezione manutenzione mancante (All. I § 1.7.4.2)", severity: "media" });
                    stato_validazione = (hasItalian && form.ha_sezione_uso_normale && form.ha_sezione_installazione) ? "valido" : "attenzione";
                }

                anomalie.push({ dati_extra });

                const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...(!isUpdate && { macchinario_id: macchinarioId, componente_id: componenteId ?? null, tipo_documento: tipoDocumento }),
                        nome_file, url_storage,
                        // Fields only relevant for dichiarazione_ce / certificazione_componente
                        normativa_citata: (tipoDocumento === "dichiarazione_ce" || tipoDocumento === "certificazione_componente") ? (form.normativa_citata || null) : null,
                        normativa_valida: (tipoDocumento === "dichiarazione_ce" || tipoDocumento === "certificazione_componente") ? (form.normativa_valida ?? true) : null,
                        firmato: (tipoDocumento === "dichiarazione_ce" || tipoDocumento === "certificazione_componente") ? (form.firmato ?? false) : null,
                        mandatario_ue: form.mandatario_ue || null,
                        data_documento: form.data_documento || null,
                        norme_armonizzate: Array.isArray(form.norme_armonizzate) ? form.norme_armonizzate : null,
                        stato_validazione,
                        anomalie_rilevate: anomalie,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error ?? err.message ?? "Errore salvataggio CE");
                }
            } else {
                const method = isUpdate ? "PATCH" : "POST";
                const url = isUpdate
                    ? `/api/v1/pratiche/${praticaId}/documenti-doganali/${existingId}`
                    : `/api/v1/pratiche/${praticaId}/documenti-doganali`;
                const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...(!isUpdate && { tipo_documento: tipoDocumento }),
                        nome_file, url_storage,
                        codice_hs_nel_doc: form.codice_hs_nel_doc || null,
                        valore_commerciale: form.valore_commerciale || null,
                        valuta: form.valuta || "USD",
                        peso_doc_kg: form.peso_doc_kg || null,
                        descrizione_merce_doc: form.descrizione_merce_doc || null,
                        incoterms_doc: form.incoterms_doc || null,
                        numero_colli_doc: form.numero_colli ? parseInt(form.numero_colli) : null,
                        stato_validazione: "da_verificare",
                        anomalie_rilevate: [{ dati_extra }],
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error ?? err.message ?? "Errore salvataggio doganale");
                }
            }

            // Ricalcolo automatico del risk score/cross-check (fire & forget)
            fetch(`/api/v1/pratiche/${praticaId}/risk-score/calculate`, { method: "POST" }).catch(() => {});

            toast(`${tipoLabel} ${isUpdate ? "aggiornato" : "caricato"} con successo`, "success");
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
            {isUpdate ? "Aggiorna" : "Carica"}
        </button>
    );

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        {step === 2 && <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white transition"><ArrowLeft className="w-4 h-4" /></button>}
                        <div>
                            <h3 className="text-base font-semibold text-white">{tipoLabel}</h3>
                            <p className="text-xs text-slate-500">
                                {isUpdate
                                    ? step === 1 ? "Sostituisci file" : "Modifica metadati"
                                    : `Step ${step} di 2 — ${step === 1 ? "Seleziona file" : "Verifica dati"}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => { setOpen(false); reset(); }} className="text-slate-400 hover:text-white transition"><X className="w-4 h-4" /></button>
                </div>

                {/* Step 1 — File */}
                {step === 1 && (
                    <div className="p-6 space-y-4">
                        {/* In update mode: show current file info */}
                        {isUpdate && existingDoc?.url_storage && existingDoc.url_storage !== "#" && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700">
                                <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-200 truncate">{existingDoc.nome_file ?? "File caricato"}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">File attualmente salvato</p>
                                </div>
                                <a href={existingDoc.url_storage} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition shrink-0">
                                    <Eye className="w-3.5 h-3.5" /> Visualizza
                                </a>
                            </div>
                        )}

                        <div onClick={() => fileRef.current?.click()}
                            className="flex flex-col items-center gap-3 border-2 border-dashed border-slate-600 rounded-xl px-6 py-8 cursor-pointer hover:border-blue-500 transition group">
                            <Paperclip className="w-8 h-8 text-slate-500 group-hover:text-blue-400 transition" />
                            <div className="text-center">
                                <p className="text-sm text-slate-300">{selectedFile ? selectedFile.name : isUpdate ? "Clicca per sostituire il file" : "Clicca per selezionare il file"}</p>
                                <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG — max 10 MB</p>
                            </div>
                        </div>
                        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                            onChange={e => {
                            const f = e.target.files?.[0] ?? null;
                            setFileName(f?.name ?? null);
                            setSelectedFile(f);
                        }} />

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => { setOpen(false); reset(); }}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm transition">
                                Annulla
                            </button>
                            {selectedFile ? (
                                <button type="button" onClick={handleAnalyze} disabled={isAnalyzing}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm transition">
                                    {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisi AI...</> : <><Sparkles className="w-4 h-4" /> Analizza e Continua</>}
                                </button>
                            ) : (
                                <button type="button" onClick={() => setStep(2)}
                                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2.5 rounded-lg text-sm transition">
                                    {isUpdate ? "Mantieni file attuale →" : "Compila manualmente →"}
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
                    <form onSubmit={handleSave} noValidate className="p-6 space-y-4">
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
        </div>,
        document.body
    );
}
