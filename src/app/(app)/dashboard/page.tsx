import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, risk_scores, macchinari, documenti_ce, documenti_doganali } from "@/lib/db/schema";
import { eq, desc, sql, count, and, isNull, inArray } from "drizzle-orm";
import Link from "next/link";
import {
    FolderOpen, AlertTriangle, TrendingUp, BarChart2, ArrowRight, Plus,
    Clock, ShieldAlert
} from "lucide-react";
import RiskScoreBadge from "@/components/ui/RiskScoreBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";

async function getDashboardData(org_id: string) {
    const [
        pratiche_attive_res,
        pratiche_a_rischio_res,
        score_res,
        lista,
        senza_data_res,
        activeMacchinariList,
        activePraticheList,
    ] = await Promise.all([
        db.select({ count: count() })
            .from(pratiche)
            .where(and(eq(pratiche.organization_id, org_id), sql`${pratiche.stato} NOT IN ('bloccata')`)),

        db.select({ count: count() })
            .from(risk_scores)
            .innerJoin(pratiche, eq(risk_scores.pratica_id, pratiche.id))
            .where(and(eq(pratiche.organization_id, org_id), sql`${risk_scores.livello_rischio} IN ('alto', 'critico')`)),

        db.select({ avg: sql<number>`COALESCE(ROUND(AVG(${risk_scores.score_globale})), 0)` })
            .from(risk_scores)
            .innerJoin(pratiche, eq(risk_scores.pratica_id, pratiche.id))
            .where(eq(pratiche.organization_id, org_id)),

        db.select({
            id: pratiche.id,
            codice_pratica: pratiche.codice_pratica,
            nome_pratica: pratiche.nome_pratica,
            fornitore_cinese: pratiche.fornitore_cinese,
            stato: pratiche.stato,
            data_prevista_arrivo: pratiche.data_prevista_arrivo,
            score_globale: risk_scores.score_globale,
            livello_rischio: risk_scores.livello_rischio,
        })
            .from(pratiche)
            .leftJoin(risk_scores, eq(risk_scores.pratica_id, pratiche.id))
            .where(eq(pratiche.organization_id, org_id))
            .orderBy(desc(pratiche.created_at))
            .limit(10),

        db.select({ count: count() })
            .from(pratiche)
            .where(and(
                eq(pratiche.organization_id, org_id),
                isNull(pratiche.data_prevista_arrivo),
                sql`${pratiche.stato} NOT IN ('bloccata', 'approvata')`
            )),

        db.select({ id: macchinari.id, lunghezza_cm: macchinari.lunghezza_cm })
            .from(macchinari)
            .innerJoin(pratiche, eq(macchinari.pratica_id, pratiche.id))
            .where(and(eq(pratiche.organization_id, org_id), sql`${pratiche.stato} NOT IN ('bloccata', 'approvata')`)),

        db.select({ id: pratiche.id })
            .from(pratiche)
            .where(and(eq(pratiche.organization_id, org_id), sql`${pratiche.stato} NOT IN ('bloccata', 'approvata')`)),
    ]);

    const macchinarioIds = activeMacchinariList.map(m => m.id).filter((id): id is string => id !== null);
    const praticaIds = activePraticheList.map(p => p.id).filter((id): id is string => id !== null);

    const [ceDocs, doganalDocs] = await Promise.all([
        macchinarioIds.length > 0
            ? db.select({ macchinario_id: documenti_ce.macchinario_id, tipo_documento: documenti_ce.tipo_documento })
                .from(documenti_ce)
                .where(and(
                    inArray(documenti_ce.macchinario_id, macchinarioIds),
                    sql`${documenti_ce.tipo_documento} IN ('dichiarazione_ce', 'manuale_uso', 'fascicolo_tecnico', 'analisi_rischi', 'schemi_elettrici')`
                ))
            : Promise.resolve([]),
        praticaIds.length > 0
            ? db.select({ pratica_id: documenti_doganali.pratica_id, tipo_documento: documenti_doganali.tipo_documento })
                .from(documenti_doganali)
                .where(and(
                    inArray(documenti_doganali.pratica_id, praticaIds),
                    sql`${documenti_doganali.tipo_documento} IN ('bill_of_lading', 'fattura_commerciale', 'packing_list')`
                ))
            : Promise.resolve([]),
    ]);

    // CE completeness: count macchinari with < 5 required docs
    const ceMap = new Map<string, Set<string>>();
    for (const doc of ceDocs) {
        if (!ceMap.has(doc.macchinario_id)) ceMap.set(doc.macchinario_id, new Set());
        ceMap.get(doc.macchinario_id)!.add(doc.tipo_documento);
    }
    const ce_incompleta = activeMacchinariList.filter(m => (ceMap.get(m.id)?.size ?? 0) < 5).length;

    // Doganali completeness: count pratiche with < 3 required docs
    const doganaliMap = new Map<string, Set<string>>();
    for (const doc of doganalDocs) {
        if (!doganaliMap.has(doc.pratica_id)) doganaliMap.set(doc.pratica_id, new Set());
        doganaliMap.get(doc.pratica_id)!.add(doc.tipo_documento);
    }
    const doganali_incompleti = activePraticheList.filter(p => (doganaliMap.get(p.id)?.size ?? 0) < 3).length;

    const senza_dimensioni = activeMacchinariList.filter(m => !m.lunghezza_cm).length;

    return {
        pratiche_attive: pratiche_attive_res[0]?.count ?? 0,
        pratiche_a_rischio: pratiche_a_rischio_res[0]?.count ?? 0,
        score_medio: Number(score_res[0]?.avg ?? 0),
        pratiche_senza_data: senza_data_res[0]?.count ?? 0,
        ce_incompleta,
        doganali_incompleti,
        senza_dimensioni,
        lista,
    };
}

export default async function DashboardPage() {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;

    const data = org_id ? await getDashboardData(org_id) : null;

    const kpis = [
        {
            label: "Pratiche Attive",
            value: data?.pratiche_attive ?? 0,
            icon: FolderOpen,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
        },
        {
            label: "A Rischio Alto/Critico",
            value: data?.pratiche_a_rischio ?? 0,
            icon: AlertTriangle,
            color: "text-red-400",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
        },
        {
            label: "Score Medio Conformità",
            value: `${data?.score_medio ?? 0}/100`,
            icon: TrendingUp,
            color: "text-green-400",
            bg: "bg-green-500/10",
            border: "border-green-500/20",
        },
        {
            label: "Pratiche Totali",
            value: data?.lista?.length ?? 0,
            icon: BarChart2,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
        },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Panoramica compliance import macchinari</p>
                </div>
                <Link
                    href="/pratiche/nuova"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-4 h-4" />
                    Nuova Pratica
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className={`glass-card p-5 border ${kpi.border}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{kpi.label}</p>
                                <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pratiche Table */}
            <div className="glass-card overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-400" /> Pratiche Recenti
                    </h2>
                    <Link href="/pratiche" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition">
                        Vedi tutte <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {!data?.lista?.length ? (
                    <div className="p-12 text-center">
                        <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Nessuna pratica ancora creata.</p>
                        <Link href="/pratiche/nuova" className="mt-4 inline-block bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition">
                            Crea la prima pratica
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    {["Codice", "Pratica", "Fornitore", "Stato", "Score Rischio", "Arrivo Previsto", "Azioni"].map((h) => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {data.lista.map((p) => {
                                    const score = p.score_globale ? Number(p.score_globale) : null;
                                    const level = p.livello_rischio ?? "da_verificare";
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-800/30 transition">
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                                                    {p.codice_pratica}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-white truncate max-w-[200px]">{p.nome_pratica}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm text-slate-400 truncate max-w-[160px]">{p.fornitore_cinese ?? "—"}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge stato={p.stato} />
                                            </td>
                                            <td className="px-5 py-4">
                                                {score !== null ? (
                                                    <RiskScoreBadge score={score} level={level} size="sm" />
                                                ) : (
                                                    <span className="text-xs text-slate-600">Non calcolato</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDate(p.data_prevista_arrivo)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <Link
                                                    href={`/pratiche/${p.id}`}
                                                    className="text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1 transition"
                                                >
                                                    Apri <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Alerts */}
            {data && (data.pratiche_senza_data > 0 || data.ce_incompleta > 0 || data.doganali_incompleti > 0 || data.senza_dimensioni > 0) && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Avvisi</h2>

                    {data.pratiche_senza_data > 0 && (
                        <div className="glass-card p-4 border border-yellow-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-yellow-300">
                                            {data.pratiche_senza_data} {data.pratiche_senza_data === 1 ? "pratica" : "pratiche"} senza data di arrivo prevista
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">Inserisci la data per monitorare correttamente le scadenze</p>
                                    </div>
                                </div>
                                <Link href="/pratiche" className="text-xs text-yellow-400 hover:text-yellow-300 transition shrink-0">Gestisci →</Link>
                            </div>
                        </div>
                    )}

                    {data.ce_incompleta > 0 && (
                        <div className="glass-card p-4 border border-orange-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-orange-300">
                                            {data.ce_incompleta} {data.ce_incompleta === 1 ? "macchinario" : "macchinari"} con documenti CE incompleti
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">Carica i documenti CE obbligatori: Dichiarazione CE, Manuale, Fascicolo, Analisi Rischi, Schemi Elettrici</p>
                                    </div>
                                </div>
                                <Link href="/pratiche" className="text-xs text-orange-400 hover:text-orange-300 transition shrink-0">Completa →</Link>
                            </div>
                        </div>
                    )}

                    {data.doganali_incompleti > 0 && (
                        <div className="glass-card p-4 border border-orange-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-orange-300">
                                            {data.doganali_incompleti} {data.doganali_incompleti === 1 ? "pratica" : "pratiche"} con documenti doganali incompleti
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">Mancano uno o più tra: Bill of Lading, Fattura Commerciale, Packing List</p>
                                    </div>
                                </div>
                                <Link href="/pratiche" className="text-xs text-orange-400 hover:text-orange-300 transition shrink-0">Completa →</Link>
                            </div>
                        </div>
                    )}

                    {data.senza_dimensioni > 0 && (
                        <div className="glass-card p-4 border border-slate-600/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-300">
                                            {data.senza_dimensioni} {data.senza_dimensioni === 1 ? "macchinario" : "macchinari"} senza dimensioni fisiche
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">Le dimensioni (L × P × H) sono utili per la pianificazione logistica</p>
                                    </div>
                                </div>
                                <Link href="/pratiche" className="text-xs text-slate-400 hover:text-slate-300 transition shrink-0">Inserisci →</Link>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!org_id && (
                <div className="glass-card p-6 border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-300">Configurazione richiesta</p>
                            <p className="text-sm text-slate-400 mt-1">
                                Il tuo account non è associato a un&apos;organizzazione. Configura il database e il seed per iniziare.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
