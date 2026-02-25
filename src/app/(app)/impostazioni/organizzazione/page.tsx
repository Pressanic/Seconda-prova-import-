"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
    nome: z.string().min(2, "Minimo 2 caratteri"),
    partita_iva: z.string().length(11, "La P.IVA deve essere di 11 cifre").regex(/^\d+$/, "Solo numeri"),
    pec: z.string().email("Email PEC non valida").or(z.literal("")).optional(),
});
type FormData = z.infer<typeof schema>;

const inputClass = "w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const PIANO_LABELS: Record<string, { label: string; color: string }> = {
    free: { label: "Free", color: "text-slate-400 bg-slate-500/10" },
    professional: { label: "Professional", color: "text-blue-400 bg-blue-500/10" },
    enterprise: { label: "Enterprise", color: "text-purple-400 bg-purple-500/10" },
};

export default function OrganizzazionePage() {
    const [saved, setSaved] = useState(false);
    const [piano, setPiano] = useState<string>("free");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    useEffect(() => {
        fetch("/api/v1/organizzazione")
            .then(r => r.json())
            .then(org => {
                reset({ nome: org.nome, partita_iva: org.partita_iva, pec: org.pec ?? "" });
                setPiano(org.piano ?? "free");
            });
    }, [reset]);

    const onSubmit = async (data: FormData) => {
        setSaved(false);
        const res = await fetch("/api/v1/organizzazione", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            setSaved(true);
            reset(data);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    const pianoInfo = PIANO_LABELS[piano] ?? PIANO_LABELS.free;

    return (
        <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
            <div>
                <Link href="/impostazioni" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition">
                    <ArrowLeft className="w-4 h-4" /> Impostazioni
                </Link>
                <h1 className="text-2xl font-bold text-white">Organizzazione</h1>
                <p className="text-slate-400 text-sm mt-0.5">Gestisci i dati della tua organizzazione</p>
            </div>

            {/* Piano */}
            <div className="glass-card p-5 flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Piano Attivo</p>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${pianoInfo.color}`}>
                        {pianoInfo.label}
                    </span>
                </div>
                <Building2 className="w-8 h-8 text-slate-600" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Ragione Sociale *</label>
                    <input {...register("nome")} placeholder="Es. Mario Rossi S.r.l." className={inputClass} />
                    {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Partita IVA *</label>
                    <input {...register("partita_iva")} placeholder="12345678901" maxLength={11} className={inputClass} />
                    {errors.partita_iva && <p className="text-red-400 text-xs mt-1">{errors.partita_iva.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">PEC</label>
                    <input {...register("pec")} type="email" placeholder="azienda@pec.it" className={inputClass} />
                    {errors.pec && <p className="text-red-400 text-xs mt-1">{errors.pec.message}</p>}
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <button
                        type="submit"
                        disabled={isSubmitting || !isDirty}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salva Modifiche"}
                    </button>
                    {saved && (
                        <span className="flex items-center gap-1.5 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" /> Salvato
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
