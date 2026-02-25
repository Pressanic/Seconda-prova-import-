"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Loader2, AlertTriangle } from "lucide-react";

const schema = z.object({
    nome_macchina: z.string().min(3, "Minimo 3 caratteri"),
    modello: z.string().min(2, "Minimo 2 caratteri"),
    anno_produzione: z.coerce.number().min(1900).max(2026),
    numero_seriale: z.string().min(1, "Campo obbligatorio"),
    stato_macchina: z.enum(["nuova", "usata"]),
    potenza_kw: z.coerce.number().optional(),
    ha_sistemi_idraulici: z.boolean().default(false),
    ha_sistemi_pneumatici: z.boolean().default(false),
    ha_automazioni_robot: z.boolean().default(false),
    paese_destinazione: z.string().length(2).default("IT"),
    descrizione_tecnica: z.string().min(20, "Minimo 20 caratteri"),
    funzione_principale: z.string().min(1, "Campo obbligatorio"),
    tipologia_lavorazione: z.string().optional(),
});

interface FormData {
    nome_macchina: string;
    modello: string;
    anno_produzione: number;
    numero_seriale: string;
    stato_macchina: "nuova" | "usata";
    potenza_kw?: number;
    ha_sistemi_idraulici: boolean;
    ha_sistemi_pneumatici: boolean;
    ha_automazioni_robot: boolean;
    paese_destinazione: string;
    descrizione_tecnica: string;
    funzione_principale: string;
    tipologia_lavorazione?: string;
}

const inputClass =
    "w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export default function MacchinarioPage() {
    const router = useRouter();
    const params = useParams();
    const praticaId = params.id as string;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [existing, setExisting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = useForm<FormData>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            stato_macchina: "nuova",
            paese_destinazione: "IT",
            ha_sistemi_idraulici: false,
            ha_sistemi_pneumatici: false,
            ha_automazioni_robot: false,
        },
    });

    const statoMacchina = watch("stato_macchina");
    const haRobot = watch("ha_automazioni_robot");

    useEffect(() => {
        fetch(`/api/v1/pratiche/${praticaId}/macchinario`)
            .then((r) => r.json())
            .then((data) => {
                if (data && data.id) {
                    setExisting(true);
                    reset({
                        nome_macchina: data.nome_macchina,
                        modello: data.modello,
                        anno_produzione: data.anno_produzione,
                        numero_seriale: data.numero_seriale ?? "",
                        stato_macchina: data.stato_macchina,
                        potenza_kw: data.potenza_kw ? Number(data.potenza_kw) : undefined,
                        ha_sistemi_idraulici: data.ha_sistemi_idraulici ?? false,
                        ha_sistemi_pneumatici: data.ha_sistemi_pneumatici ?? false,
                        ha_automazioni_robot: data.ha_automazioni_robot ?? false,
                        paese_destinazione: data.paese_destinazione ?? "IT",
                        descrizione_tecnica: data.descrizione_tecnica ?? "",
                        funzione_principale: data.funzione_principale ?? "",
                        tipologia_lavorazione: data.tipologia_lavorazione ?? "",
                    });
                }
            })
            .finally(() => setLoading(false));
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
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? "Errore salvataggio");
            }
            router.refresh();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-white">Anagrafica Macchinario</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                    {existing ? "Modifica i dati del macchinario" : "Inserisci i dati del macchinario associato a questa pratica"}
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            {/* Business rule alerts */}
            {statoMacchina === "usata" && (
                <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-lg px-4 py-3 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Macchina usata</p>
                        <p className="text-xs text-yellow-400 mt-0.5">
                            Sarà necessario un rapporto di ispezione aggiuntivo nella sezione Compliance CE.
                        </p>
                    </div>
                </div>
            )}
            {haRobot && (
                <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg px-4 py-3 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Automazioni / Robot rilevati</p>
                        <p className="text-xs text-blue-400 mt-0.5">
                            Sarà richiesta la conformità alla Direttiva Macchine 2023/1230 Art. 12 (sistemi autonomi).
                        </p>
                    </div>
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
                        {errors.modello && <p className="text-red-400 text-xs mt-1">{errors.modello.message}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Anno Produzione *</label>
                        <input {...register("anno_produzione")} type="number" className={inputClass} />
                        {errors.anno_produzione && <p className="text-red-400 text-xs mt-1">{errors.anno_produzione.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Numero Seriale *</label>
                        <input {...register("numero_seriale")} className={inputClass} />
                        {errors.numero_seriale && <p className="text-red-400 text-xs mt-1">{errors.numero_seriale.message}</p>}
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
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Sistemi Presenti</label>
                    {[
                        { name: "ha_sistemi_idraulici" as const, label: "Sistemi idraulici" },
                        { name: "ha_sistemi_pneumatici" as const, label: "Sistemi pneumatici" },
                        { name: "ha_automazioni_robot" as const, label: "Automazioni / Robot" },
                    ].map(({ name, label }) => (
                        <label
                            key={name}
                            className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800/60 transition"
                        >
                            <input {...register(name)} type="checkbox" className="w-4 h-4 accent-blue-500" />
                            <span className="text-sm text-slate-300">{label}</span>
                        </label>
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Descrizione Tecnica * <span className="text-xs text-slate-500">(min 20 caratteri)</span>
                    </label>
                    <textarea {...register("descrizione_tecnica")} rows={4} className={`${inputClass} resize-none`} />
                    {errors.descrizione_tecnica && <p className="text-red-400 text-xs mt-1">{errors.descrizione_tecnica.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Funzione Principale *</label>
                    <input {...register("funzione_principale")} className={inputClass} />
                    {errors.funzione_principale && <p className="text-red-400 text-xs mt-1">{errors.funzione_principale.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipologia Lavorazione</label>
                    <input {...register("tipologia_lavorazione")} className={inputClass} />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {existing ? "Aggiorna Macchinario" : "Salva Macchinario"}
                </button>
            </form>
        </div>
    );
}
