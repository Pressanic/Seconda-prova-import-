"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";

// ─── STEP 1 SCHEMA ───────────────────────────────────────────────────────────
const step1Schema = z.object({
    nome_pratica: z.string().min(3, "Minimo 3 caratteri"),
    fornitore_cinese: z.string().min(2, "Inserisci il fornitore"),
    data_prevista_arrivo: z.string().min(1, "Seleziona una data"),
    note: z.string().optional(),
});
type Step1Data = z.infer<typeof step1Schema>;

// ─── STEP 2 SCHEMA ───────────────────────────────────────────────────────────
const step2Schema = z.object({
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
type Step2Data = z.infer<typeof step2Schema>;

const STEPS = ["Anagrafica Pratica", "Macchinario"];

function FieldGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
            {children}
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    );
}

const inputClass = "w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const toggleClass = "flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800/60 transition";

export default function NuovaPraticaPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Step 1 form ──
    const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });

    // ── Step 2 form ──
    const form2 = useForm<Step2Data>({
        resolver: zodResolver(step2Schema),
        defaultValues: {
            stato_macchina: "nuova",
            paese_destinazione: "IT",
            ha_sistemi_idraulici: false,
            ha_sistemi_pneumatici: false,
            ha_automazioni_robot: false,
        },
    });

    const onStep1 = (data: Step1Data) => {
        setStep1Data(data);
        setStep(1);
    };

    const onStep2 = async (data: Step2Data) => {
        if (!step1Data) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/v1/pratiche", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...step1Data, macchinario: data }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Errore creazione pratica");
            router.push(`/pratiche/${json.id}`);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => step === 0 ? router.push("/pratiche") : setStep(0)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" /> {step === 0 ? "Pratiche" : "Indietro"}
                </button>
                <h1 className="text-2xl font-bold text-white">Nuova Pratica di Import</h1>

                {/* Stepper */}
                <div className="flex items-center gap-3 mt-5">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition
                  ${i < step ? "bg-blue-600 border-blue-600 text-white" :
                                        i === step ? "border-blue-500 text-blue-400" :
                                            "border-slate-600 text-slate-600"}`}>
                                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className={`text-sm font-medium ${i === step ? "text-white" : i < step ? "text-blue-400" : "text-slate-600"}`}>
                                    {s}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && <div className={`h-px w-16 ${i < step ? "bg-blue-500" : "bg-slate-700"}`} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── STEP 1 ─────────────────────────────────────────────────── */}
            {step === 0 && (
                <form onSubmit={form1.handleSubmit(onStep1)} className="glass-card p-6 space-y-5">
                    <FieldGroup label="Nome Pratica *" error={form1.formState.errors.nome_pratica?.message}>
                        <input {...form1.register("nome_pratica")} placeholder="es. Pressa HAITIAN MA4600" className={inputClass} />
                    </FieldGroup>

                    <FieldGroup label="Fornitore Cinese *" error={form1.formState.errors.fornitore_cinese?.message}>
                        <input {...form1.register("fornitore_cinese")} placeholder="es. Haitian International Co. Ltd" className={inputClass} />
                    </FieldGroup>

                    <FieldGroup label="Data Prevista Arrivo *" error={form1.formState.errors.data_prevista_arrivo?.message}>
                        <input {...form1.register("data_prevista_arrivo")} type="date" className={inputClass} />
                    </FieldGroup>

                    <FieldGroup label="Note" error={undefined}>
                        <textarea {...form1.register("note")} rows={3} placeholder="Note aggiuntive..." className={`${inputClass} resize-none`} />
                    </FieldGroup>

                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition">
                        Avanti <ArrowRight className="w-4 h-4" />
                    </button>
                </form>
            )}

            {/* ── STEP 2 ─────────────────────────────────────────────────── */}
            {step === 1 && (
                <form onSubmit={form2.handleSubmit(onStep2)} className="glass-card p-6 space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <FieldGroup label="Nome Macchina *" error={form2.formState.errors.nome_macchina?.message}>
                            <input {...form2.register("nome_macchina")} placeholder="es. Pressa a Iniezione" className={inputClass} />
                        </FieldGroup>
                        <FieldGroup label="Modello *" error={form2.formState.errors.modello?.message}>
                            <input {...form2.register("modello")} placeholder="es. MA4600" className={inputClass} />
                        </FieldGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FieldGroup label="Anno Produzione *" error={form2.formState.errors.anno_produzione?.message}>
                            <input {...form2.register("anno_produzione")} type="number" placeholder="2025" className={inputClass} />
                        </FieldGroup>
                        <FieldGroup label="Numero Seriale *" error={form2.formState.errors.numero_seriale?.message}>
                            <input {...form2.register("numero_seriale")} placeholder="SN-XXXXX" className={inputClass} />
                        </FieldGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FieldGroup label="Stato Macchina *" error={form2.formState.errors.stato_macchina?.message}>
                            <select {...form2.register("stato_macchina")} className={inputClass}>
                                <option value="nuova">Nuova</option>
                                <option value="usata">Usata</option>
                            </select>
                        </FieldGroup>
                        <FieldGroup label="Potenza Elettrica (kW)" error={undefined}>
                            <input {...form2.register("potenza_kw")} type="number" step="0.1" placeholder="45.5" className={inputClass} />
                        </FieldGroup>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Sistemi Presenti</label>
                        {[
                            { name: "ha_sistemi_idraulici" as const, label: "Sistemi idraulici" },
                            { name: "ha_sistemi_pneumatici" as const, label: "Sistemi pneumatici" },
                            { name: "ha_automazioni_robot" as const, label: "Automazioni / Robot" },
                        ].map(({ name, label }) => (
                            <label key={name} className={toggleClass}>
                                <input {...form2.register(name)} type="checkbox" className="w-4 h-4 accent-blue-500" />
                                <span className="text-sm text-slate-300">{label}</span>
                            </label>
                        ))}
                    </div>

                    <FieldGroup label="Descrizione Tecnica * (min 20 caratteri)" error={form2.formState.errors.descrizione_tecnica?.message}>
                        <textarea {...form2.register("descrizione_tecnica")} rows={4} placeholder="Descrivi il macchinario, materiali lavorati, caratteristiche tecniche principali..." className={`${inputClass} resize-none`} />
                    </FieldGroup>

                    <FieldGroup label="Funzione Principale *" error={form2.formState.errors.funzione_principale?.message}>
                        <input {...form2.register("funzione_principale")} placeholder="es. Stampaggio iniezione materie plastiche" className={inputClass} />
                    </FieldGroup>

                    <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition">
                        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando pratica...</> : <><CheckCircle className="w-4 h-4" /> Crea Pratica</>}
                    </button>
                </form>
            )}
        </div>
    );
}
