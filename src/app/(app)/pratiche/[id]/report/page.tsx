import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    pratiche, macchinari, documenti_ce, documenti_doganali,
    organismi_notificati, risk_scores, organizations
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    FileText, Download, CheckCircle, XCircle, AlertTriangle,
    Circle, Shield, Package, Truck, TrendingDown, BookOpen
} from "lucide-react";
import { calcolaRiskScore } from "@/lib/services/risk-engine";
import RiskScoreBadge from "@/components/ui/RiskScoreBadge";
import { formatDate } from "@/lib/utils";

const DOC_TYPE_LABELS: Record<string, string> = {
    dichiarazione_ce: "Dichiarazione CE di Conformità",
    manuale_uso: "Manuale d'uso (IT)",
    fascicolo_tecnico: "Fascicolo Tecnico",
    analisi_rischi: "Analisi dei Rischi",
    schemi_elettrici: "Schemi Elettrici",
    certificazione_componente: "Cert. Componente",
    bill_of_lading: "Bill of Lading",
    fattura_commerciale: "Fattura Commerciale",
    packing_list: "Packing List",
    certificato_origine: "Certificato Origine",
    dichiarazione_valore: "Dichiarazione Valore",
};

const STATO_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    valido: { icon: CheckCircle, color: "text-green-400", label: "Valido" },
    non_valido: { icon: XCircle, color: "text-red-400", label: "Non Valido" },
    attenzione: { icon: AlertTriangle, color: "text-yellow-400", label: "Attenzione" },
    da_verificare: { icon: Circle, color: "text-slate-500", label: "Da Verificare" },
};

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) notFound();

    const [org] = await db.select().from(organizations).where(eq(organizations.id, org_id)).limit(1);
    const [macch] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);

    const docsCE = macch
        ? await db.select().from(documenti_ce).where(eq(documenti_ce.macchinario_id, macch.id))
        : [];
    const docsDoganali = await db.select().from(documenti_doganali)
        .where(eq(documenti_doganali.pratica_id, id));
    const [organismo] = macch
        ? await db.select().from(organismi_notificati)
            .where(eq(organismi_notificati.macchinario_id, macch.id)).limit(1)
        : [null];

    const liveScore = calcolaRiskScore({
        documenti_ce: docsCE.map(d => ({ ...d, stato_validazione: d.stato_validazione ?? "da_verificare" })),
        organismo: organismo ? { stato_verifica: organismo.stato_verifica ?? "non_verificato" } : null,
        documenti_doganali: docsDoganali.map(d => ({ ...d, stato_validazione: d.stato_validazione ?? "da_verificare" })),
        codice_hs_selezionato: macch?.codice_taric_selezionato,
    });

    return (
        <div className="space-y-5 max-w-4xl">
            {/* Report header */}
            <div className="glass-card p-5 border border-blue-500/20">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            Report di Conformità
                        </h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Anteprima del report — generato in tempo reale
                        </p>
                    </div>
                    <a
                        href={`/api/v1/pratiche/${id}/report`}
                        download
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <Download className="w-4 h-4" />
                        Scarica PDF
                    </a>
                </div>
            </div>

            {/* ── Preview content ── */}
            <div className="glass-card overflow-hidden border border-slate-700">
                {/* Preview header */}
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">ImportCompliance</p>
                        <p className="text-sm font-bold text-white mt-0.5">Report di Conformità Import Macchinari</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500">{new Date().toLocaleDateString("it-IT")}</p>
                        <p className="text-sm font-mono font-bold text-blue-400 mt-0.5">{pratica.codice_pratica}</p>
                        <p className="text-xs text-slate-400">{org?.nome}</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Section 1: Pratica */}
                    <div>
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-2 mb-3">
                            1. Dati Pratica
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase mb-0.5">Nome Pratica</p>
                                <p className="text-sm text-white">{pratica.nome_pratica}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase mb-0.5">Fornitore Cinese</p>
                                <p className="text-sm text-white">{pratica.fornitore_cinese ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase mb-0.5">Stato</p>
                                <p className="text-sm text-white capitalize">{pratica.stato.replace(/_/g, " ")}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase mb-0.5">Data Prevista Arrivo</p>
                                <p className="text-sm text-white">{pratica.data_prevista_arrivo ?? "—"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Macchinario */}
                    {macch && (
                        <div>
                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-2 mb-3 flex items-center gap-2">
                                <Package className="w-3.5 h-3.5" /> 2. Macchinario
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase mb-0.5">Nome Macchina</p>
                                    <p className="text-sm text-white">{macch.nome_macchina}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase mb-0.5">Modello</p>
                                    <p className="text-sm text-white">{macch.modello}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase mb-0.5">Anno / Stato</p>
                                    <p className="text-sm text-white">{macch.anno_produzione ?? "—"} — {macch.stato_macchina}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase mb-0.5">Codice TARIC</p>
                                    <p className="text-sm text-white font-mono">{macch.codice_taric_selezionato ?? "Non classificato"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section 3: Risk Score */}
                    <div>
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-2 mb-3">
                            3. Risk Score Complessivo
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1 flex justify-center">
                                <RiskScoreBadge score={liveScore.score_globale} level={liveScore.livello_rischio} size="lg" />
                            </div>
                            <div className="col-span-2 space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-slate-400">Score CE (×0.55)</p>
                                        <span className={`text-sm font-bold ${liveScore.score_compliance_ce >= 80 ? "text-green-400" : liveScore.score_compliance_ce >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                                            {liveScore.score_compliance_ce}/100
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${liveScore.score_compliance_ce >= 80 ? "bg-green-500" : liveScore.score_compliance_ce >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                                            style={{ width: `${liveScore.score_compliance_ce}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-slate-400">Score Doganale (×0.45)</p>
                                        <span className={`text-sm font-bold ${liveScore.score_doganale >= 80 ? "text-green-400" : liveScore.score_doganale >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                                            {liveScore.score_doganale}/100
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${liveScore.score_doganale >= 80 ? "bg-green-500" : liveScore.score_doganale >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                                            style={{ width: `${liveScore.score_doganale}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Documenti CE */}
                    <div>
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-2 mb-3 flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5" /> 4. Documenti CE
                        </h3>
                        {docsCE.length === 0 ? (
                            <p className="text-sm text-slate-500">Nessun documento CE registrato</p>
                        ) : (
                            <div className="divide-y divide-slate-700/30">
                                {docsCE.map((doc) => {
                                    const cfg = STATO_ICONS[doc.stato_validazione ?? "da_verificare"] ?? STATO_ICONS.da_verificare;
                                    const Icon = cfg.icon;
                                    return (
                                        <div key={doc.id} className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-2">
                                                <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.color}`} />
                                                <p className="text-sm text-white">
                                                    {DOC_TYPE_LABELS[doc.tipo_documento] ?? doc.tipo_documento}
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-400">{doc.nome_file}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {organismo && (
                            <div className="mt-3 pt-3 border-t border-slate-700/30">
                                <p className="text-xs text-slate-500 uppercase mb-1">Organismo Notificato</p>
                                <p className="text-sm text-white">
                                    #{organismo.numero_organismo} — {organismo.nome_organismo ?? "—"}
                                    <span className={`ml-2 text-xs ${organismo.stato_verifica === "valido" ? "text-green-400" : "text-red-400"}`}>
                                        ({organismo.stato_verifica})
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Section 5: Documenti Doganali */}
                    <div>
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-2 mb-3 flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5" /> 5. Documenti Doganali
                        </h3>
                        {docsDoganali.length === 0 ? (
                            <p className="text-sm text-slate-500">Nessun documento doganale registrato</p>
                        ) : (
                            <div className="divide-y divide-slate-700/30">
                                {docsDoganali.map((doc) => {
                                    const cfg = STATO_ICONS[doc.stato_validazione ?? "da_verificare"] ?? STATO_ICONS.da_verificare;
                                    const Icon = cfg.icon;
                                    return (
                                        <div key={doc.id} className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-2">
                                                <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.color}`} />
                                                <p className="text-sm text-white">
                                                    {DOC_TYPE_LABELS[doc.tipo_documento] ?? doc.tipo_documento}
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-400">{doc.nome_file}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Section 6: Penalità */}
                    {liveScore.dettaglio_penalita.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-2 mb-3 flex items-center gap-2">
                                <TrendingDown className="w-3.5 h-3.5" /> 6. Penalità ({liveScore.dettaglio_penalita.length})
                            </h3>
                            <div className="divide-y divide-slate-700/30">
                                {liveScore.dettaglio_penalita.map((p) => (
                                    <div key={p.codice} className="flex items-start justify-between py-2 gap-4">
                                        <div className="flex items-start gap-2">
                                            <code className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{p.codice}</code>
                                            <p className="text-sm text-slate-300">{p.descrizione}</p>
                                        </div>
                                        <span className="text-sm font-bold text-red-400 shrink-0">{p.penalita}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section 7: Raccomandazioni */}
                    {liveScore.raccomandazioni.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-2 mb-3 flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5" /> 7. Raccomandazioni
                            </h3>
                            <ol className="space-y-2">
                                {liveScore.raccomandazioni.map((r, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                        <span className="text-blue-400 font-bold shrink-0 min-w-[20px]">{i + 1}.</span>
                                        {r}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Report footer */}
                    <div className="border-t border-slate-700 pt-4 flex items-center justify-between">
                        <p className="text-xs text-slate-500">ImportCompliance — Report riservato — uso interno</p>
                        <p className="text-xs text-slate-500">{new Date().toLocaleDateString("it-IT")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
