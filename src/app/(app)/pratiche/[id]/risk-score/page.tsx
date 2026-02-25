import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, macchinari, documenti_ce, documenti_doganali, organismi_notificati, risk_scores, audit_log } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { calcolaRiskScore } from "@/lib/services/risk-engine";
import { AlertTriangle, CheckCircle, XCircle, TrendingDown, BookOpen, Loader2 } from "lucide-react";
import RiskScoreBadge from "@/components/ui/RiskScoreBadge";
import RecalculateButton from "@/components/forms/RecalculateButton";

export default async function RiskScorePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;
    const user_id = (session?.user as any)?.id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) notFound();

    // Fetch all data needed for score calculation
    const [macch] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);
    const docsCE = macch ? await db.select().from(documenti_ce).where(eq(documenti_ce.macchinario_id, macch.id)) : [];
    const docsDoganali = await db.select().from(documenti_doganali).where(eq(documenti_doganali.pratica_id, id));
    const [organismo] = macch ? await db.select().from(organismi_notificati).where(eq(organismi_notificati.macchinario_id, macch.id)).limit(1) : [null];

    // Latest stored score
    const [latestScore] = await db.select().from(risk_scores)
        .where(eq(risk_scores.pratica_id, id)).orderBy(desc(risk_scores.calcolato_at)).limit(1);

    // Compute live score for display
    const liveResult = calcolaRiskScore({
        documenti_ce: docsCE.map(d => ({ ...d, stato_validazione: d.stato_validazione ?? "da_verificare" })),
        organismo: organismo ? { stato_verifica: organismo.stato_verifica ?? "non_verificato" } : null,
        documenti_doganali: docsDoganali.map(d => ({ ...d, stato_validazione: d.stato_validazione ?? "da_verificare" })),
        codice_hs_selezionato: macch?.codice_taric_selezionato,
    });

    const severityColors: Record<string, string> = {
        critica: "text-red-400 bg-red-500/10",
        alta: "text-orange-400 bg-orange-500/10",
        media: "text-yellow-400 bg-yellow-500/10",
        bassa: "text-green-400 bg-green-500/10",
    };

    return (
        <div className="space-y-5">
            {/* Score overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-6 flex items-center justify-center flex-col border border-slate-700">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-4">Score Globale</p>
                    <RiskScoreBadge score={liveResult.score_globale} level={liveResult.livello_rischio} size="lg" />
                </div>
                <div className="glass-card p-5 space-y-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Score CE (×0.55)</p>
                    <p className={`text-3xl font-bold ${liveResult.score_compliance_ce >= 80 ? "text-green-400" : liveResult.score_compliance_ce >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                        {liveResult.score_compliance_ce}/100
                    </p>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${liveResult.score_compliance_ce >= 80 ? "bg-green-500" : liveResult.score_compliance_ce >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${liveResult.score_compliance_ce}%` }} />
                    </div>
                </div>
                <div className="glass-card p-5 space-y-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Score Doganale (×0.45)</p>
                    <p className={`text-3xl font-bold ${liveResult.score_doganale >= 80 ? "text-green-400" : liveResult.score_doganale >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                        {liveResult.score_doganale}/100
                    </p>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${liveResult.score_doganale >= 80 ? "bg-green-500" : liveResult.score_doganale >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${liveResult.score_doganale}%` }} />
                    </div>
                </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
                <RecalculateButton praticaId={id} result={liveResult} userId={user_id} orgId={org_id} />
            </div>

            {/* Penalty breakdown */}
            {liveResult.dettaglio_penalita.length > 0 ? (
                <div className="glass-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <h2 className="text-base font-semibold text-white">Penalità Applicate</h2>
                        <span className="ml-auto text-xs text-slate-500">{liveResult.dettaglio_penalita.length} anomalie</span>
                    </div>
                    <div className="divide-y divide-slate-700/40">
                        {liveResult.dettaglio_penalita.map((p) => (
                            <div key={p.codice} className="flex items-start gap-4 px-6 py-3">
                                <code className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded shrink-0 mt-0.5">{p.codice}</code>
                                <div className="flex-1">
                                    <p className="text-sm text-white">{p.descrizione}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{p.categoria}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${severityColors[p.severity] ?? "text-slate-400"}`}>
                                        {p.severity}
                                    </span>
                                    <span className="text-sm font-bold text-red-400">{p.penalita}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="glass-card p-8 text-center border border-green-500/20">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="text-green-300 font-semibold">Nessuna penalità rilevata</p>
                    <p className="text-sm text-slate-400 mt-1">Tutti i documenti sono in regola</p>
                </div>
            )}

            {/* Recommendations */}
            {liveResult.raccomandazioni.length > 0 && (
                <div className="glass-card p-5">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                        <BookOpen className="w-4 h-4 text-blue-400" /> Raccomandazioni
                    </h2>
                    <ul className="space-y-2">
                        {liveResult.raccomandazioni.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                                {r}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
