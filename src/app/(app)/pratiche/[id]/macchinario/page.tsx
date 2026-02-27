"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Loader2, AlertTriangle, Sparkles, Paperclip, ChevronDown, Plus, Trash2 } from "lucide-react";
import { FUNZIONE_PRINCIPALE_OPTIONS, guessFunzione } from "@/lib/macchinario-options";

const TIPO_AZIONAMENTO_OPTIONS = [
    { value: "idraulico", label: "Idraulico" },
    { value: "elettrico", label: "Elettrico" },
    { value: "ibrido", label: "Ibrido (elettro-idraulico)" },
];

const schema = z.object({
    nome_macchina: z.string().min(3, "Minimo 3 caratteri"),
    marca: z.string().optional(),
    modello: z.string().min(2, "Minimo 2 caratteri"),
    anno_produzione: z.coerce.number().min(1900).max(2030),
    numero_seriale: z.string().min(1, "Obbligatorio"),
    stato_macchina: z.enum(["nuova", "usata"]),
    tipo_azionamento: z.enum(["idraulico", "elettrico", "ibrido"]).optional(),
    forza_chiusura_kn: z.coerce.number().positive().optional(),
    potenza_kw: z.coerce.number().positive().optional(),
    tensione_alimentazione_v: z.coerce.number().int().positive().optional(),
    volume_iniezione_cm3: z.coerce.number().positive().optional(),
    diametro_vite_mm: z.coerce.number().positive().optional(),
    distanza_colonne_mm: z.coerce.number().positive().optional(),
    pressione_iniezione_bar: z.coerce.number().positive().optional(),
    peso_lordo_kg: z.coerce.number().positive().optional(),
    peso_netto_kg: z.coerce.number().positive().optional(),
    numero_colli_macchina: z.coerce.number().int().positive().optional(),
    lunghezza_cm: z.coerce.number().int().positive().optional(),
    larghezza_cm: z.coerce.number().int().positive().optional(),
    altezza_cm: z.coerce.number().int().positive().optional(),
    robot_estrazione_integrato: z.boolean().default(false),
    sistemi_pneumatici_ausiliari: z.boolean().default(false),
    descrizione_tecnica: z.string().min(20, "Minimo 20 caratteri"),
    funzione_principale: z.string().min(1, "Seleziona una funzione"),
});
type FormData = z.infer<typeof schema>;

interface Componente {
    id: string;
    descrizione: string;
    marca?: string | null;
    modello?: string | null;
    numero_seriale?: string | null;
    quantita?: number | null;
    peso_kg?: string | number | null;
    valore_commerciale?: string | number | null;
    ha_marcatura_ce?: boolean | null;
}

const inputClass = "w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="border-b border-slate-700/50 pb-2 mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{children}</h3>
        </div>
    );
}

export default function MacchinarioPage() {
    const router = useRouter();
    const params = useParams();
    const praticaId = params.id as string;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [existing, setExisting] = useState(false);

    // CE auto-fill
    const [ceOpen, setCeOpen] = useState(false);
    const [ceLoading, setCeLoading] = useState(false);
    const [ceProposal, setCeProposal] = useState<Record<string, any> | null>(null);
    const [ceFileName, setCeFileName] = useState<string | null>(null);
    const ceFileRef = useRef<HTMLInputElement>(null);

    // Componentistica
    const [hasComponenti, setHasComponenti] = useState(false);
    const [componenti, setComponenti] = useState<Componente[]>([]);
    const [addingComponente, setAddingComponente] = useState(false);
    const [newComp, setNewComp] = useState<{
        descrizione: string; marca: string; modello: string;
        numero_seriale: string; quantita: number; peso_kg: string;
        valore_commerciale: string; ha_marcatura_ce: boolean;
    }>({ descrizione: "", marca: "", modello: "", numero_seriale: "", quantita: 1, peso_kg: "", valore_commerciale: "", ha_marcatura_ce: false });

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema) as any,
        defaultValues: { stato_macchina: "nuova", robot_estrazione_integrato: false, sistemi_pneumatici_ausiliari: false },
    });

    const statoMacchina = watch("stato_macchina");
    const robotIntegrato = watch("robot_estrazione_integrato");
    const descrizione = watch("descrizione_tecnica");
    const funzioneAttuale = watch("funzione_principale");

    useEffect(() => {
        if (descrizione && descrizione.length > 15 && !funzioneAttuale) {
            const guess = guessFunzione(descrizione);
            if (guess) setValue("funzione_principale", guess, { shouldValidate: false });
        }
    }, [descrizione, funzioneAttuale, setValue]);

    useEffect(() => {
        fetch(`/api/v1/pratiche/${praticaId}/macchinario`)
            .then(r => r.json())
            .then(data => {
                if (data?.id) {
                    setExisting(true);
                    reset({
                        nome_macchina: data.nome_macchina,
                        marca: data.marca ?? "",
                        modello: data.modello,
                        anno_produzione: data.anno_produzione,
                        numero_seriale: data.numero_seriale ?? "",
                        stato_macchina: data.stato_macchina,
                        tipo_azionamento: data.tipo_azionamento ?? undefined,
                        forza_chiusura_kn: data.forza_chiusura_kn ? Number(data.forza_chiusura_kn) : undefined,
                        potenza_kw: data.potenza_kw ? Number(data.potenza_kw) : undefined,
                        tensione_alimentazione_v: data.tensione_alimentazione_v ? Number(data.tensione_alimentazione_v) : undefined,
                        volume_iniezione_cm3: data.volume_iniezione_cm3 ? Number(data.volume_iniezione_cm3) : undefined,
                        diametro_vite_mm: data.diametro_vite_mm ? Number(data.diametro_vite_mm) : undefined,
                        distanza_colonne_mm: data.distanza_colonne_mm ? Number(data.distanza_colonne_mm) : undefined,
                        pressione_iniezione_bar: data.pressione_iniezione_bar ? Number(data.pressione_iniezione_bar) : undefined,
                        peso_lordo_kg: data.peso_lordo_kg ? Number(data.peso_lordo_kg) : undefined,
                        peso_netto_kg: data.peso_netto_kg ? Number(data.peso_netto_kg) : undefined,
                        numero_colli_macchina: data.numero_colli_macchina ?? undefined,
                        lunghezza_cm: data.lunghezza_cm ?? undefined,
                        larghezza_cm: data.larghezza_cm ?? undefined,
                        altezza_cm: data.altezza_cm ?? undefined,
                        robot_estrazione_integrato: data.robot_estrazione_integrato ?? false,
                        sistemi_pneumatici_ausiliari: data.sistemi_pneumatici_ausiliari ?? false,
                        descrizione_tecnica: data.descrizione_tecnica ?? "",
                        funzione_principale: data.funzione_principale ?? "",
                    });
                }
            }).finally(() => setLoading(false));
    }, [praticaId, reset]);

    useEffect(() => {
        fetch(`/api/v1/pratiche/${praticaId}/componenti`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setComponenti(data);
                    setHasComponenti(true);
                }
            }).catch(() => { });
    }, [praticaId]);

    const onSubmit = async (data: FormData) => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/pratiche/${praticaId}/macchinario`, {
                method: existing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Errore salvataggio"); }
            setExisting(true);
            router.refresh();
        } catch (e: any) { setError(e.message); } finally { setSaving(false); }
    };

    const handleCeAnalyze = async () => {
        const file = ceFileRef.current?.files?.[0];
        if (!file) return;
        setCeLoading(true);
        setCeProposal(null);
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
                body: JSON.stringify({ file_base64: base64, mime_type: file.type, tipo_documento: "dichiarazione_ce" }),
            });
            const json = await res.json();
            if (json.campi_estratti) setCeProposal(json.campi_estratti);
        } catch { /* silent */ } finally { setCeLoading(false); }
    };

    const applyCeProposal = () => {
        if (!ceProposal) return;
        if (ceProposal.nome_macchina) setValue("nome_macchina", ceProposal.nome_macchina);
        if (ceProposal.marca) setValue("marca", ceProposal.marca);
        if (ceProposal.modello) setValue("modello", ceProposal.modello);
        if (ceProposal.numero_seriale) setValue("numero_seriale", ceProposal.numero_seriale);
        if (ceProposal.anno_produzione) setValue("anno_produzione", ceProposal.anno_produzione);
        setCeProposal(null);
        setCeOpen(false);
    };

    const addComponente = async () => {
        if (!newComp.descrizione) return;
        try {
            const payload = {
                descrizione: newComp.descrizione,
                marca: newComp.marca || null,
                modello: newComp.modello || null,
                numero_seriale: newComp.numero_seriale || null,
                quantita: newComp.quantita,
                peso_kg: newComp.peso_kg ? Number(newComp.peso_kg) : null,
                valore_commerciale: newComp.valore_commerciale ? Number(newComp.valore_commerciale) : null,
                ha_marcatura_ce: newComp.ha_marcatura_ce,
            };
            const res = await fetch(`/api/v1/pratiche/${praticaId}/componenti`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const saved = await res.json();
            setComponenti(prev => [...prev, saved]);
            setNewComp({ descrizione: "", marca: "", modello: "", numero_seriale: "", quantita: 1, peso_kg: "", valore_commerciale: "", ha_marcatura_ce: false });
            setAddingComponente(false);
        } catch { /* silent */ }
    };

    const deleteComponente = async (id: string) => {
        try {
            await fetch(`/api/v1/pratiche/${praticaId}/componenti/${id}`, { method: "DELETE" });
            setComponenti(prev => prev.filter(c => c.id !== id));
        } catch { /* silent */ }
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>;

    return (
        <div className="max-w-2xl space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-white">Anagrafica Macchinario</h2>
                <p className="text-sm text-slate-400 mt-0.5">{existing ? "Modifica i dati del macchinario" : "Inserisci i dati del macchinario"}</p>
            </div>

            {/* CE auto-fill */}
            <div className="glass-card border border-blue-500/20">
                <button type="button" onClick={() => setCeOpen(!ceOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-blue-400 hover:text-blue-300 transition">
                    <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Carica Dichiarazione CE per auto-compilazione
                        <span className="text-slate-500 text-xs">(facoltativo)</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${ceOpen ? "rotate-180" : ""}`} />
                </button>
                {ceOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400 pt-3">Carica la Dichiarazione CE per estrarre automaticamente marca, modello e numero seriale.</p>
                        <div className="flex items-center gap-3">
                            <div onClick={() => ceFileRef.current?.click()}
                                className="flex items-center gap-2 flex-1 border border-dashed border-slate-600 rounded-lg px-3 py-2 cursor-pointer hover:border-blue-500 transition">
                                <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-xs text-slate-400 truncate">{ceFileName ?? "Seleziona PDF..."}</span>
                            </div>
                            <input ref={ceFileRef} type="file" accept=".pdf" className="hidden"
                                onChange={e => { setCeFileName(e.target.files?.[0]?.name ?? null); setCeProposal(null); }} />
                            <button type="button" onClick={handleCeAnalyze} disabled={!ceFileName || ceLoading}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs px-3 py-2 rounded-lg transition">
                                {ceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                Analizza
                            </button>
                        </div>
                        {ceProposal && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-2">
                                <p className="text-xs font-semibold text-blue-300">Dati estratti — verifica e applica:</p>
                                {Object.entries(ceProposal).filter(([, v]) => v).map(([k, v]) => (
                                    <div key={k} className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-400 w-32 shrink-0">{k.replace(/_/g, " ")}</span>
                                        <span className="text-white">{String(v)}</span>
                                    </div>
                                ))}
                                <button type="button" onClick={applyCeProposal}
                                    className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 rounded-lg transition">
                                    Applica questi dati al form
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>}

            {statoMacchina === "usata" && (
                <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-lg px-4 py-3 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Macchina usata</p>
                        <p className="text-xs text-yellow-400 mt-0.5">Richiede analisi dei rischi aggiornata (Dir. 2006/42/CE) e rapporto di ispezione tecnica nella sezione Compliance CE.</p>
                    </div>
                </div>
            )}

            {robotIntegrato && (
                <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg px-4 py-3 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Robot di estrazione integrato</p>
                        <p className="text-xs text-blue-400 mt-0.5">Il robot è parte integrante della pressa e deve essere coperto dalla stessa Dichiarazione CE.</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-7">

                {/* IDENTIFICAZIONE */}
                <div>
                    <SectionTitle>Identificazione</SectionTitle>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Nome Macchina *</label>
                            <input {...register("nome_macchina")} placeholder="es. Pressa ad iniezione Haitian MA5500/II" className={inputClass} />
                            {errors.nome_macchina && <p className="text-red-400 text-xs mt-1">{errors.nome_macchina.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Marca</label>
                                <input {...register("marca")} placeholder="es. Haitian, Chen Hsong, Engel" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Modello *</label>
                                <input {...register("modello")} placeholder="es. MA5500/II" className={inputClass} />
                                {errors.modello && <p className="text-red-400 text-xs mt-1">{errors.modello.message}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Anno Produzione *</label>
                                <input {...register("anno_produzione")} type="number" min="1990" max="2030" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Numero Seriale *</label>
                                <input {...register("numero_seriale")} placeholder="es. HT-2024-0892" className={inputClass} />
                                {errors.numero_seriale && <p className="text-red-400 text-xs mt-1">{errors.numero_seriale.message}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Stato Macchina *</label>
                                <select {...register("stato_macchina")} className={inputClass}>
                                    <option value="nuova">Nuova</option>
                                    <option value="usata">Usata</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Tipo Azionamento</label>
                                <select {...register("tipo_azionamento")} className={inputClass}>
                                    <option value="">— Seleziona —</option>
                                    {TIPO_AZIONAMENTO_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SPECIFICHE TECNICHE PRINCIPALI */}
                <div>
                    <SectionTitle>Specifiche Tecniche Principali</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Forza di Chiusura (kN)</label>
                            <input {...register("forza_chiusura_kn")} type="number" step="0.1" placeholder="es. 5500" className={inputClass} />
                            <p className="text-xs text-slate-600 mt-0.5">Parametro dimensionale chiave della pressa</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Potenza Totale (kW)</label>
                            <input {...register("potenza_kw")} type="number" step="0.1" placeholder="es. 45" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Tensione Alimentazione (V)</label>
                            <input {...register("tensione_alimentazione_v")} type="number" placeholder="es. 400" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Pressione di Iniezione (bar)</label>
                            <input {...register("pressione_iniezione_bar")} type="number" step="0.1" placeholder="es. 1800" className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* UNITÀ DI INIEZIONE */}
                <div>
                    <SectionTitle>Unità di Iniezione</SectionTitle>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Volume Iniezione (cm³)</label>
                            <input {...register("volume_iniezione_cm3")} type="number" step="0.1" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Diametro Vite (mm)</label>
                            <input {...register("diametro_vite_mm")} type="number" step="0.1" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Distanza Colonne (mm)</label>
                            <input {...register("distanza_colonne_mm")} type="number" step="0.1" className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* DIMENSIONI E PESO */}
                <div>
                    <SectionTitle>Dimensioni e Peso</SectionTitle>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Lunghezza (cm)</label>
                            <input {...register("lunghezza_cm")} type="number" placeholder="cm" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Larghezza (cm)</label>
                            <input {...register("larghezza_cm")} type="number" placeholder="cm" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Altezza (cm)</label>
                            <input {...register("altezza_cm")} type="number" placeholder="cm" className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Peso Lordo (kg)</label>
                            <input {...register("peso_lordo_kg")} type="number" step="0.1" className={inputClass} />
                            <p className="text-xs text-slate-600 mt-0.5">Cross-check doganale BL</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Peso Netto (kg)</label>
                            <input {...register("peso_netto_kg")} type="number" step="0.1" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">N° Colli</label>
                            <input {...register("numero_colli_macchina")} type="number" min="1" className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* SISTEMI INTEGRATI */}
                <div>
                    <SectionTitle>Sistemi Integrati nella Macchina</SectionTitle>
                    <div className="space-y-2">
                        {([
                            { name: "robot_estrazione_integrato" as const, label: "Robot di estrazione integrato", hint: "Incluso nella stessa Dichiarazione CE della pressa" },
                            { name: "sistemi_pneumatici_ausiliari" as const, label: "Sistemi pneumatici ausiliari", hint: "Richiedono schemi pneumatici nel fascicolo tecnico" },
                        ]).map(({ name, label, hint }) => (
                            <label key={name} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800/60 transition">
                                <input {...register(name)} type="checkbox" className="w-4 h-4 accent-blue-500 mt-0.5" />
                                <div>
                                    <span className="text-sm text-slate-300 block">{label}</span>
                                    <span className="text-xs text-slate-500">{hint}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* NOTE TECNICHE */}
                <div>
                    <SectionTitle>Note Tecniche</SectionTitle>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Descrizione Tecnica *
                                <span className="text-slate-500 font-normal ml-1">(min 20 caratteri)</span>
                            </label>
                            <textarea
                                {...register("descrizione_tecnica")}
                                rows={4}
                                placeholder="Descrizione completa: applicazione, materiali lavorati, caratteristiche operative..."
                                className={`${inputClass} resize-none`}
                            />
                            {errors.descrizione_tecnica && <p className="text-red-400 text-xs mt-1">{errors.descrizione_tecnica.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Funzione Principale *</label>
                            <select {...register("funzione_principale")} className={inputClass}>
                                <option value="">— Seleziona —</option>
                                {FUNZIONE_PRINCIPALE_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                            </select>
                            {errors.funzione_principale && <p className="text-red-400 text-xs mt-1">{errors.funzione_principale.message}</p>}
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {existing ? "Aggiorna Macchinario" : "Salva Macchinario"}
                </button>
            </form>

            {/* COMPONENTISTICA */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-1">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Componentistica Aggiuntiva</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Accessori spediti con la pressa: stampi, robot separati, controllori hot runner, ecc.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setHasComponenti(v => !v)}
                        className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${hasComponenti ? "bg-blue-500" : "bg-slate-600"}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${hasComponenti ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                </div>

                {hasComponenti && (
                    <div className="space-y-3 mt-4">
                        {componenti.map(comp => (
                            <div key={comp.id} className="flex items-start gap-3 bg-slate-800/40 rounded-lg border border-slate-700 p-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{comp.descrizione}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 mt-1 text-xs text-slate-400">
                                        {comp.marca && <span>{comp.marca}</span>}
                                        {comp.modello && <span>{comp.modello}</span>}
                                        {comp.numero_seriale && <span className="text-slate-500">S/N: {comp.numero_seriale}</span>}
                                        {comp.peso_kg && <span>{Number(comp.peso_kg).toLocaleString()} kg</span>}
                                        {comp.quantita && comp.quantita > 1 && <span>× {comp.quantita}</span>}
                                        {comp.ha_marcatura_ce && (
                                            <span className="text-blue-400 font-medium">CE richiesta</span>
                                        )}
                                    </div>
                                </div>
                                <button type="button" onClick={() => deleteComponente(comp.id)}
                                    className="text-slate-500 hover:text-red-400 transition p-1 shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {addingComponente ? (
                            <div className="bg-slate-800/60 rounded-lg border border-slate-600 p-4 space-y-3">
                                <p className="text-xs font-semibold text-slate-300">Nuovo componente</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Descrizione *</label>
                                        <input
                                            value={newComp.descrizione}
                                            onChange={e => setNewComp(p => ({ ...p, descrizione: e.target.value }))}
                                            placeholder="es. Robot di estrazione YUSHIN RG-125"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Marca</label>
                                        <input value={newComp.marca} onChange={e => setNewComp(p => ({ ...p, marca: e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Modello</label>
                                        <input value={newComp.modello} onChange={e => setNewComp(p => ({ ...p, modello: e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">N° Seriale</label>
                                        <input value={newComp.numero_seriale} onChange={e => setNewComp(p => ({ ...p, numero_seriale: e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Quantità</label>
                                        <input type="number" min="1" value={newComp.quantita}
                                            onChange={e => setNewComp(p => ({ ...p, quantita: Number(e.target.value) }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Peso (kg)</label>
                                        <input type="number" step="0.1" value={newComp.peso_kg}
                                            onChange={e => setNewComp(p => ({ ...p, peso_kg: e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Valore Commerciale (€)</label>
                                        <input type="number" step="0.01" value={newComp.valore_commerciale}
                                            onChange={e => setNewComp(p => ({ ...p, valore_commerciale: e.target.value }))} className={inputClass} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={newComp.ha_marcatura_ce}
                                                onChange={e => setNewComp(p => ({ ...p, ha_marcatura_ce: e.target.checked }))}
                                                className="w-4 h-4 accent-blue-500" />
                                            <span className="text-xs text-slate-300">
                                                Richiede marcatura CE propria
                                                <span className="text-slate-500 ml-1">(es. robot autonomo, attrezzatura indipendente)</span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={addComponente} disabled={!newComp.descrizione}
                                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs px-3 py-2 rounded-lg transition">
                                        <Save className="w-3.5 h-3.5" />
                                        Aggiungi
                                    </button>
                                    <button type="button"
                                        onClick={() => { setAddingComponente(false); setNewComp({ descrizione: "", marca: "", modello: "", numero_seriale: "", quantita: 1, peso_kg: "", valore_commerciale: "", ha_marcatura_ce: false }); }}
                                        className="text-xs text-slate-400 hover:text-white px-3 py-2 transition">
                                        Annulla
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={() => setAddingComponente(true)}
                                className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-600 rounded-lg py-2.5 text-xs text-slate-400 hover:border-blue-500 hover:text-blue-400 transition">
                                <Plus className="w-4 h-4" />
                                Aggiungi componente
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
