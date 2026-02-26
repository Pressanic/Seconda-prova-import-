"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Loader2, AlertTriangle, Sparkles, Paperclip, ChevronDown } from "lucide-react";
import { FUNZIONE_PRINCIPALE_OPTIONS, guessFunzione } from "@/lib/macchinario-options";

const schema = z.object({
    nome_macchina: z.string().min(3),
    modello: z.string().min(2),
    anno_produzione: z.coerce.number().min(1900).max(2030),
    numero_seriale: z.string().min(1),
    stato_macchina: z.enum(["nuova", "usata"]),
    potenza_kw: z.coerce.number().optional(),
    ha_sistemi_idraulici: z.boolean().default(false),
    ha_sistemi_pneumatici: z.boolean().default(false),
    ha_automazioni_robot: z.boolean().default(false),
    paese_destinazione: z.string().length(2).default("IT"),
    descrizione_tecnica: z.string().min(20, "Minimo 20 caratteri"),
    funzione_principale: z.string().min(1, "Seleziona una funzione"),
    tipologia_lavorazione: z.string().optional(),
    lunghezza_cm: z.coerce.number().int().positive().optional(),
    larghezza_cm: z.coerce.number().int().positive().optional(),
    altezza_cm: z.coerce.number().int().positive().optional(),
});
type FormData = z.infer<typeof schema>;

const inputClass = "w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export default function MacchinarioPage() {
    const router = useRouter();
    const params = useParams();
    const praticaId = params.id as string;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [existing, setExisting] = useState(false);

    // CE auto-fill state
    const [ceOpen, setCeOpen] = useState(false);
    const [ceLoading, setCeLoading] = useState(false);
    const [ceProposal, setCeProposal] = useState<Record<string, any> | null>(null);
    const [ceFileName, setCeFileName] = useState<string | null>(null);
    const ceFileRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema) as any,
        defaultValues: { stato_macchina: "nuova", paese_destinazione: "IT", ha_sistemi_idraulici: false, ha_sistemi_pneumatici: false, ha_automazioni_robot: false },
    });

    const statoMacchina = watch("stato_macchina");
    const haRobot = watch("ha_automazioni_robot");
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
                        nome_macchina: data.nome_macchina, modello: data.modello,
                        anno_produzione: data.anno_produzione, numero_seriale: data.numero_seriale ?? "",
                        stato_macchina: data.stato_macchina,
                        potenza_kw: data.potenza_kw ? Number(data.potenza_kw) : undefined,
                        ha_sistemi_idraulici: data.ha_sistemi_idraulici ?? false,
                        ha_sistemi_pneumatici: data.ha_sistemi_pneumatici ?? false,
                        ha_automazioni_robot: data.ha_automazioni_robot ?? false,
                        paese_destinazione: data.paese_destinazione ?? "IT",
                        descrizione_tecnica: data.descrizione_tecnica ?? "",
                        funzione_principale: data.funzione_principale ?? "",
                        tipologia_lavorazione: data.tipologia_lavorazione ?? "",
                        lunghezza_cm: data.lunghezza_cm ?? undefined,
                        larghezza_cm: data.larghezza_cm ?? undefined,
                        altezza_cm: data.altezza_cm ?? undefined,
                    });
                }
            }).finally(() => setLoading(false));
    }, [praticaId, reset]);

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
        if (ceProposal.modello) setValue("modello", ceProposal.modello);
        if (ceProposal.numero_seriale) setValue("numero_seriale", ceProposal.numero_seriale);
        if (ceProposal.anno_produzione) setValue("anno_produzione", ceProposal.anno_produzione);
        setCeProposal(null);
        setCeOpen(false);
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>;

    return (
        <div className="max-w-2xl space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-white">Anagrafica Macchinario</h2>
                <p className="text-sm text-slate-400 mt-0.5">{existing ? "Modifica i dati del macchinario" : "Inserisci i dati del macchinario"}</p>
            </div>

            {/* CE auto-fill card */}
            <div className="glass-card border border-blue-500/20">
                <button type="button" onClick={() => setCeOpen(!ceOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-blue-400 hover:text-blue-300 transition">
                    <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Carica Dichiarazione CE per auto-compilazione <span className="text-slate-500 text-xs">(facoltativo)</span></span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${ceOpen ? "rotate-180" : ""}`} />
                </button>
                {ceOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400 pt-3">Carica la Dichiarazione CE per estrarre automaticamente nome, modello e numero seriale della macchina.</p>
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
                    <div><p className="font-semibold">Macchina usata</p><p className="text-xs text-yellow-400 mt-0.5">Sarà necessario un rapporto di ispezione aggiuntivo nella sezione Compliance CE.</p></div>
                </div>
            )}
            {haRobot && (
                <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg px-4 py-3 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div><p className="font-semibold">Automazioni / Robot rilevati</p><p className="text-xs text-blue-400 mt-0.5">Sarà richiesta la conformità alla Direttiva Macchine 2023/1230 Art. 12.</p></div>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome Macchina *</label>
                        <input {...register("nome_macchina")} className={inputClass} />
                        {errors.nome_macchina && <p className="text-red-400 text-xs mt-1">{errors.nome_macchina.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Modello *</label>
                        <input {...register("modello")} className={inputClass} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Anno Produzione *</label>
                        <input {...register("anno_produzione")} type="number" className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Numero Seriale *</label>
                        <input {...register("numero_seriale")} className={inputClass} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Stato Macchina *</label>
                        <select {...register("stato_macchina")} className={inputClass}>
                            <option value="nuova">Nuova</option>
                            <option value="usata">Usata</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Potenza (kW)</label>
                        <input {...register("potenza_kw")} type="number" step="0.1" className={inputClass} />
                    </div>
                </div>

                {/* Dimensioni */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Dimensioni Fisiche <span className="text-slate-500 text-xs">(facoltative)</span></label>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <input {...register("lunghezza_cm")} type="number" placeholder="Lunghezza (cm)" className={inputClass} />
                        </div>
                        <div>
                            <input {...register("larghezza_cm")} type="number" placeholder="Larghezza (cm)" className={inputClass} />
                        </div>
                        <div>
                            <input {...register("altezza_cm")} type="number" placeholder="Altezza (cm)" className={inputClass} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Sistemi Presenti</label>
                    {([{ name: "ha_sistemi_idraulici" as const, label: "Sistemi idraulici" }, { name: "ha_sistemi_pneumatici" as const, label: "Sistemi pneumatici" }, { name: "ha_automazioni_robot" as const, label: "Automazioni / Robot" }]).map(({ name, label }) => (
                        <label key={name} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800/60 transition">
                            <input {...register(name)} type="checkbox" className="w-4 h-4 accent-blue-500" />
                            <span className="text-sm text-slate-300">{label}</span>
                        </label>
                    ))}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrizione Tecnica * <span className="text-xs text-slate-500">(min 20 caratteri)</span></label>
                    <textarea {...register("descrizione_tecnica")} rows={4} className={`${inputClass} resize-none`} />
                    {errors.descrizione_tecnica && <p className="text-red-400 text-xs mt-1">{errors.descrizione_tecnica.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Funzione Principale *</label>
                    <select {...register("funzione_principale")} className={inputClass}>
                        <option value="">— Seleziona —</option>
                        {FUNZIONE_PRINCIPALE_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                    </select>
                    {funzioneAttuale && <p className="text-xs text-blue-400 mt-1">✓ Auto-suggerita dalla descrizione</p>}
                    {errors.funzione_principale && <p className="text-red-400 text-xs mt-1">{errors.funzione_principale.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipologia Lavorazione</label>
                    <input {...register("tipologia_lavorazione")} className={inputClass} />
                </div>

                <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {existing ? "Aggiorna Macchinario" : "Salva Macchinario"}
                </button>
            </form>
        </div>
    );
}
