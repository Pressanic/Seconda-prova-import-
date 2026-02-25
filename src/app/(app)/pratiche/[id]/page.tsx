import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, macchinari, documenti_ce, documenti_doganali, risk_scores } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, getRiskColor } from "@/lib/utils";
import { Clock, FileText, Package, ShieldCheck, Truck, AlertTriangle, CheckCircle, Circle } from "lucide-react";
import RiskScoreBadge from "@/components/ui/RiskScoreBadge";
import StatusBadge from "@/components/ui/StatusBadge";

export default async function PraticaOverviewPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) notFound();

    const [macchinario] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);
    const docsCE = macchinario ? await db.select().from(documenti_ce).where(eq(documenti_ce.macchinario_id, macchinario.id)) : [];
    const docsDoganali = await db.select().from(documenti_doganali).where(eq(documenti_doganali.pratica_id, id));
    const [riskScore] = await db.select().from(risk_scores).where(eq(risk_scores.pratica_id, id))
        .orderBy(desc(risk_scores.calcolato_at)).limit(1);

    const docsCERequired = ["dichiarazione_ce", "manuale_uso", "fascicolo_tecnico", "analisi_rischi", "schemi_elettrici"];
    const presentCE = docsCE.map(d => d.tipo_documento);
    const missingCE = docsCERequired.filter(t => !presentCE.includes(t));

    const docsDoganaliRequired = ["bill_of_lading", "fattura_commerciale", "packing_list"];
    const presentDoganali = docsDoganali.map(d => d.tipo_documento);
    const missingDoganali = docsDoganaliRequired.filter(t => !presentDoganali.includes(t));

    const score = riskScore ? Number(riskScore.score_globale) : null;
    const level = riskScore?.livello_rischio ?? "da_verificare";
    const riskColors = getRiskColor(level);

    const tipoDocLabel: Record<string, string> = {
        dichiarazione_ce: "Dichiarazione CE", manuale_uso: "Manuale d'uso",
        fascicolo_tecnico: "Fascicolo Tecnico", analisi_rischi: "Analisi dei Rischi",
        schemi_elettrici: "Schemi Elettrici", bill_of_lading: "Bill of Lading",
        fattura_commerciale: "Fattura Commerciale", packing_list: "Packing List",
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left col: main info */}
            <div className="lg:col-span-2 space-y-5">
                {/* Pratica info card */}
                <div className="glass-card p-5">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Informazioni Pratica</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Codice", value: <code className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs">{pratica.codice_pratica}</code> },
                            { label: "Stato", value: <StatusBadge stato={pratica.stato} /> },
                            { label: "Fornitore", value: pratica.fornitore_cinese ?? "—" },
                            { label: "Arrivo Previsto", value: formatDate(pratica.data_prevista_arrivo) },
                            { label: "Sdoganamento", value: formatDate(pratica.data_sdoganamento) },
                            { label: "Creata il", value: formatDate(pratica.created_at?.toString()) },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                                <div className="text-sm text-white">{value}</div>
                            </div>
                        ))}
                    </div>
                    {pratica.note && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-1">Note</p>
                            <p className="text-sm text-slate-300">{pratica.note}</p>
                        </div>
                    )}
                </div>

                {/* Macchinario info */}
                {macchinario ? (
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Macchinario</h2>
                            <Link href={`/pratiche/${id}/macchinario`} className="text-xs text-blue-400 hover:text-blue-300 transition">Modifica →</Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Nome", value: macchinario.nome_macchina },
                                { label: "Modello", value: macchinario.modello },
                                { label: "Seriale", value: macchinario.numero_seriale ?? "—" },
                                { label: "Anno", value: macchinario.anno_produzione?.toString() ?? "—" },
                                { label: "Stato", value: macchinario.stato_macchina === "nuova" ? "🟢 Nuova" : "🟡 Usata" },
                                { label: "Potenza", value: macchinario.potenza_kw ? `${macchinario.potenza_kw} kW` : "—" },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                                    <p className="text-sm text-white">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="glass-card p-5 border border-yellow-500/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                <div>
                                    <p className="text-sm font-medium text-white">Macchinario non registrato</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Aggiungi i dati del macchinario per calcolare il risk score</p>
                                </div>
                            </div>
                            <Link href={`/pratiche/${id}/macchinario`} className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 text-xs px-3 py-1.5 rounded-lg transition">
                                Aggiungi
                            </Link>
                        </div>
                    </div>
                )}

                {/* Document status */}
                <div className="glass-card p-5">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Stato Documenti</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* CE docs */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Documenti CE</p>
                                <Link href={`/pratiche/${id}/compliance-ce`} className="text-xs text-blue-400">Gestisci →</Link>
                            </div>
                            <div className="space-y-1.5">
                                {docsCERequired.map(tipo => {
                                    const present = presentCE.includes(tipo);
                                    return (
                                        <div key={tipo} className="flex items-center gap-2">
                                            {present ? <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                                            <span className={`text-xs ${present ? "text-slate-300" : "text-slate-600"}`}>{tipoDocLabel[tipo] ?? tipo}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Doganali docs */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-purple-400" /> Documenti Doganali</p>
                                <Link href={`/pratiche/${id}/documenti-doganali`} className="text-xs text-blue-400">Gestisci →</Link>
                            </div>
                            <div className="space-y-1.5">
                                {docsDoganaliRequired.map(tipo => {
                                    const present = presentDoganali.includes(tipo);
                                    return (
                                        <div key={tipo} className="flex items-center gap-2">
                                            {present ? <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                                            <span className={`text-xs ${present ? "text-slate-300" : "text-slate-600"}`}>{tipoDocLabel[tipo] ?? tipo}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right col: risk score */}
            <div className="space-y-5">
                <div className="glass-card p-5">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Risk Score</h2>
                    {score !== null ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center py-4">
                                <RiskScoreBadge score={score} level={level} size="lg" />
                            </div>
                            <div className="space-y-2">
                                {[
                                    { label: "Score CE", value: Number(riskScore?.score_compliance_ce ?? 0) },
                                    { label: "Score Doganale", value: Number(riskScore?.score_doganale ?? 0) },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">{label}</span>
                                            <span className="text-white font-medium">{value}/100</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : value >= 40 ? "bg-orange-500" : "bg-red-500"}`}
                                                style={{ width: `${value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link href={`/pratiche/${id}/risk-score`}
                                className="w-full block text-center bg-slate-700 hover:bg-slate-600 text-sm text-white py-2 rounded-lg transition">
                                Dettaglio Completo →
                            </Link>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <div className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                <ShieldCheck className="w-7 h-7 text-slate-500" />
                            </div>
                            <p className="text-sm text-slate-400 mb-3">Score non ancora calcolato</p>
                            <Link href={`/pratiche/${id}/risk-score`}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition">
                                Calcola ora
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
