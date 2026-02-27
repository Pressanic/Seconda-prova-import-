import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, risk_scores } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    CheckCircle2, XCircle, TriangleAlert, AlertTriangle,
    ShieldCheck, ArrowRight,
} from "lucide-react";
import RiskScoreBadge from "@/components/ui/RiskScoreBadge";
import RecalculateButton from "@/components/forms/RecalculateButton";

interface AzioneRichiesta {
    priorita: "critica" | "importante" | "consigliata";
    area: string;
    titolo: string;
    descrizione: string;
    link: string;
    codice_anomalia: string;
}

const AREA_CONFIG: Record<string, { label: string; color: string }> = {
    ce:           { label: "CE",         color: "bg-blue-500/15 text-blue-300" },
    doganale:     { label: "Doganale",   color: "bg-purple-500/15 text-purple-300" },
    macchinario:  { label: "Macchina",   color: "bg-orange-500/15 text-orange-300" },
    pratica:      { label: "Pratica",    color: "bg-slate-500/20 text-slate-300" },
    coerenza:     { label: "Coerenza",   color: "bg-yellow-500/15 text-yellow-300" },
};

export default async function RiskScorePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) notFound();

    const [latestScore] = await db.select().from(risk_scores)
        .where(eq(risk_scores.pratica_id, id)).orderBy(desc(risk_scores.calcolato_at)).limit(1);

    if (!latestScore) {
        return (
            <div className="glass-card p-12 text-center space-y-4">
                <ShieldCheck className="w-14 h-14 text-slate-500 mx-auto" />
                <p className="text-lg font-semibold text-white">Risk score non ancora calcolato</p>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    Calcola il risk score per ottenere una valutazione del rischio della pratica
                    e la lista delle azioni necessarie.
                </p>
                <RecalculateButton praticaId={id} />
            </div>
        );
    }

    const score = Number(latestScore.score_globale);
    const level = latestScore.livello_rischio ?? "da_verificare";
    const azioni = (latestScore.azioni_richieste as AzioneRichiesta[]) ?? [];
    const critiche = azioni.filter(a => a.priorita === "critica");
    const importanti = azioni.filter(a => a.priorita === "importante");
    const consigliate = azioni.filter(a => a.priorita === "consigliata");

    // Stato pratica badge
    const statoPratica =
        critiche.length > 0
            ? { label: `Bloccante — ${critiche.length} problem${critiche.length === 1 ? "a critico" : "i critici"}`, color: "border-red-500/40 bg-red-500/5 text-red-400", icon: XCircle }
            : importanti.length > 0
            ? { label: `Attenzione — ${importanti.length} problem${importanti.length === 1 ? "a importante" : "i importanti"}`, color: "border-orange-500/40 bg-orange-500/5 text-orange-400", icon: TriangleAlert }
            : consigliate.length > 0
            ? { label: `${consigliate.length} suggeriment${consigliate.length === 1 ? "o" : "i"} disponibil${consigliate.length === 1 ? "e" : "i"}`, color: "border-yellow-500/40 bg-yellow-500/5 text-yellow-400", icon: AlertTriangle }
            : { label: "Pronta per l'importazione", color: "border-green-500/40 bg-green-500/5 text-green-400", icon: CheckCircle2 };

    const StatoIcon = statoPratica.icon;

    return (
        <div className="space-y-5">

            {/* Stato pratica — header card */}
            <div className={`glass-card p-5 border ${statoPratica.color} flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                    <StatoIcon className="w-6 h-6 shrink-0" />
                    <div>
                        <p className="text-base font-semibold">{statoPratica.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Score globale: <span className="font-medium text-white">{score}/100</span>
                            {" · "}
                            {new Date(latestScore.calcolato_at!).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                </div>
                <RecalculateButton praticaId={id} />
            </div>

            {/* Azioni richieste */}
            {azioni.length === 0 ? (
                <div className="glass-card p-8 text-center border border-green-500/20">
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="text-green-300 font-semibold">Nessuna azione richiesta</p>
                    <p className="text-sm text-slate-400 mt-1">Tutti i controlli sono superati</p>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700">
                        <h2 className="text-sm font-semibold text-white">Azioni richieste</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{azioni.length} totali — ordinate per priorità</p>
                    </div>

                    {[
                        { gruppo: critiche, label: "CRITICHE", borderColor: "border-red-500/30", dotColor: "bg-red-500", icon: XCircle, iconColor: "text-red-400" },
                        { gruppo: importanti, label: "IMPORTANTI", borderColor: "border-orange-500/30", dotColor: "bg-orange-500", icon: TriangleAlert, iconColor: "text-orange-400" },
                        { gruppo: consigliate, label: "CONSIGLIATE", borderColor: "border-yellow-500/30", dotColor: "bg-yellow-500", icon: AlertTriangle, iconColor: "text-yellow-400" },
                    ].filter(g => g.gruppo.length > 0).map(({ gruppo, label, borderColor, dotColor, icon: Icon, iconColor }) => (
                        <div key={label} className={`border-l-2 ${borderColor}`}>
                            <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/40">
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                <span className="text-[11px] font-semibold text-slate-400 tracking-widest">{label}</span>
                                <span className="text-[11px] text-slate-600 ml-auto">{gruppo.length}</span>
                            </div>
                            <div className="divide-y divide-slate-700/30">
                                {gruppo.map((azione) => {
                                    const areaCfg = AREA_CONFIG[azione.area] ?? { label: azione.area, color: "bg-slate-600/20 text-slate-400" };
                                    return (
                                        <Link
                                            key={azione.codice_anomalia}
                                            href={azione.link}
                                            className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-700/25 transition group"
                                        >
                                            <Icon className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm text-white font-medium leading-snug">{azione.titolo}</p>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${areaCfg.color}`}>{areaCfg.label}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{azione.descrizione}</p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 shrink-0 mt-0.5 transition" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Score dettaglio — secondario */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Dettaglio Score</h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 items-center">
                    <div className="flex justify-center sm:col-span-1">
                        <RiskScoreBadge score={score} level={level} size="lg" />
                    </div>
                    <div className="sm:col-span-3 space-y-3">
                        {[
                            { label: "CE Compliance", value: Number(latestScore.score_compliance_ce) },
                            { label: "Doganale", value: Number(latestScore.score_doganale) },
                            { label: "Coerenza dati", value: Number(latestScore.score_coerenza ?? 100) },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">{label}</span>
                                    <span className={`font-medium ${value >= 80 ? "text-green-400" : value >= 60 ? "text-yellow-400" : value >= 40 ? "text-orange-400" : "text-red-400"}`}>
                                        {value}/100
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : value >= 40 ? "bg-orange-500" : "bg-red-500"}`}
                                        style={{ width: `${value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
