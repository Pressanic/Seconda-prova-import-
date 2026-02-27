import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, macchinari, documenti_ce, documenti_doganali, risk_scores } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ShieldCheck, Truck, AlertTriangle, CheckCircle, Circle, Package2, CheckCircle2 } from "lucide-react";
import RiskScoreBadge from "@/components/ui/RiskScoreBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import PraticaDoganaleForm from "@/components/forms/PraticaDoganaleForm";

const DOCS_CE_REQUIRED = ["dichiarazione_ce", "manuale_uso", "fascicolo_tecnico"];
const DOCS_DOG_REQUIRED = ["bill_of_lading", "fattura_commerciale", "packing_list"];
const DOC_LABEL: Record<string, string> = {
    dichiarazione_ce: "Dichiarazione CE", manuale_uso: "Manuale d'uso",
    fascicolo_tecnico: "Fascicolo Tecnico", bill_of_lading: "Bill of Lading",
    fattura_commerciale: "Fattura Commerciale", packing_list: "Packing List",
};

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

    const presentCE = docsCE.map(d => d.tipo_documento);
    const presentDoganali = docsDoganali.map(d => d.tipo_documento);
    const score = riskScore ? Number(riskScore.score_globale) : null;
    const level = riskScore?.livello_rischio ?? "da_verificare";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">

                {/* MRN banner se sdoganata */}
                {pratica.mrn_doganale && (
                    <div className="glass-card p-4 border border-green-500/30 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-green-400">Pratica sdoganata</p>
                            <p className="text-xs text-slate-400">
                                MRN: <code className="text-green-300">{pratica.mrn_doganale}</code>
                                {pratica.data_sdoganamento && <> — {formatDate(pratica.data_sdoganamento)}</>}
                            </p>
                        </div>
                    </div>
                )}

                {/* Pratica info */}
                <div className="glass-card p-5">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Informazioni Pratica</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Codice", value: <code className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs">{pratica.codice_pratica}</code> },
                            { label: "Stato", value: <StatusBadge stato={pratica.stato} /> },
                            { label: "Fornitore", value: pratica.fornitore_cinese ?? "—" },
                            { label: "Arrivo Previsto", value: formatDate(pratica.data_prevista_arrivo) },
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

                {/* Dati doganali pratica */}
                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                            <Truck className="w-4 h-4 text-purple-400" /> Dati Doganali
                        </h2>
                        {(!pratica.eori_importatore || !pratica.incoterms) && (
                            <span className="text-xs text-orange-400 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Dati mancanti
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <p className="text-xs text-slate-500 mb-0.5">EORI Importatore</p>
                            {pratica.eori_importatore
                                ? <p className="text-sm text-white font-mono">{pratica.eori_importatore}</p>
                                : <p className="text-sm text-orange-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Non inserito</p>}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-0.5">Incoterms</p>
                            {pratica.incoterms
                                ? <span className="text-sm font-semibold text-white bg-slate-700 px-2 py-0.5 rounded">{pratica.incoterms}</span>
                                : <p className="text-sm text-orange-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Non inseriti</p>}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-0.5">Porto di Arrivo</p>
                            <p className="text-sm text-white">{pratica.porto_arrivo ?? "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-0.5">Spedizioniere</p>
                            <p className="text-sm text-white">{pratica.spedizioniere ?? "—"}</p>
                        </div>
                        {pratica.mrn_doganale && (
                            <div className="col-span-2">
                                <p className="text-xs text-slate-500 mb-0.5">MRN Doganale</p>
                                <p className="text-sm text-green-400 font-mono">{pratica.mrn_doganale}</p>
                            </div>
                        )}
                    </div>
                    <PraticaDoganaleForm
                        praticaId={id}
                        initial={{
                            eori_importatore: pratica.eori_importatore ?? "",
                            incoterms: pratica.incoterms ?? "",
                            porto_arrivo: pratica.porto_arrivo ?? "",
                            spedizioniere: pratica.spedizioniere ?? "",
                            mrn_doganale: pratica.mrn_doganale ?? "",
                        }}
                    />
                </div>

                {/* Macchinario */}
                {macchinario ? (
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                <Package2 className="w-4 h-4 text-blue-400" /> Macchinario
                            </h2>
                            <Link href={`/pratiche/${id}/macchinario`} className="text-xs text-blue-400 hover:text-blue-300 transition">Modifica →</Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Marca / Modello", value: [macchinario.marca, macchinario.modello].filter(Boolean).join(" ") },
                                { label: "Seriale", value: macchinario.numero_seriale ?? "—" },
                                { label: "Anno / Stato", value: `${macchinario.anno_produzione ?? "—"} — ${macchinario.stato_macchina === "nuova" ? "Nuova" : "Usata"}` },
                                { label: "Azionamento", value: macchinario.tipo_azionamento ?? "—" },
                                { label: "Forza chiusura", value: macchinario.forza_chiusura_kn ? `${macchinario.forza_chiusura_kn} kN` : "—" },
                                { label: "Peso lordo", value: macchinario.peso_lordo_kg ? `${macchinario.peso_lordo_kg} kg` : "—" },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                                    <p className="text-sm text-white">{value}</p>
                                </div>
                            ))}
                        </div>
                        {!macchinario.peso_lordo_kg && (
                            <p className="text-xs text-orange-400 flex items-center gap-1 mt-3">
                                <AlertTriangle className="w-3 h-3" /> Peso lordo mancante — necessario per i cross-check doganali
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="glass-card p-5 border border-yellow-500/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                <div>
                                    <p className="text-sm font-medium text-white">Macchinario non registrato</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Aggiungi i dati per abilitare i cross-check</p>
                                </div>
                            </div>
                            <Link href={`/pratiche/${id}/macchinario`} className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 text-xs px-3 py-1.5 rounded-lg transition">Aggiungi</Link>
                        </div>
                    </div>
                )}

                {/* Stato documenti */}
                <div className="glass-card p-5">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Stato Documenti</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Documenti CE</p>
                                <Link href={`/pratiche/${id}/compliance-ce`} className="text-xs text-blue-400">Gestisci →</Link>
                            </div>
                            <div className="space-y-1.5">
                                {DOCS_CE_REQUIRED.map(tipo => {
                                    const present = presentCE.includes(tipo);
                                    return (
                                        <div key={tipo} className="flex items-center gap-2">
                                            {present ? <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                                            <span className={`text-xs ${present ? "text-slate-300" : "text-slate-600"}`}>{DOC_LABEL[tipo]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-purple-400" /> Documenti Doganali</p>
                                <Link href={`/pratiche/${id}/documenti-doganali`} className="text-xs text-blue-400">Gestisci →</Link>
                            </div>
                            <div className="space-y-1.5">
                                {DOCS_DOG_REQUIRED.map(tipo => {
                                    const present = presentDoganali.includes(tipo);
                                    return (
                                        <div key={tipo} className="flex items-center gap-2">
                                            {present ? <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                                            <span className={`text-xs ${present ? "text-slate-300" : "text-slate-600"}`}>{DOC_LABEL[tipo]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right col */}
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
                                    { label: "CE Compliance", value: Number(riskScore?.score_compliance_ce ?? 0) },
                                    { label: "Doganale", value: Number(riskScore?.score_doganale ?? 0) },
                                    { label: "Coerenza dati", value: Number(riskScore?.score_coerenza ?? 100) },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">{label}</span>
                                            <span className="text-white font-medium">{value}/100</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : value >= 40 ? "bg-orange-500" : "bg-red-500"}`}
                                                style={{ width: `${value}%` }} />
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

                <div className="glass-card p-4 space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Sezioni</p>
                    {[
                        { href: `/pratiche/${id}/macchinario`, label: "Macchinario" },
                        { href: `/pratiche/${id}/compliance-ce`, label: "Compliance CE" },
                        { href: `/pratiche/${id}/classificazione-hs`, label: "Classificazione HS" },
                        { href: `/pratiche/${id}/documenti-doganali`, label: "Documenti Doganali" },
                        { href: `/pratiche/${id}/risk-score`, label: "Risk Score" },
                        { href: `/pratiche/${id}/report`, label: "Report PDF" },
                    ].map(({ href, label }) => (
                        <Link key={href} href={href} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition">
                            {label} <span className="text-slate-600">→</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
