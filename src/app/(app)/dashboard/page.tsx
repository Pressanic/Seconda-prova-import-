import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, risk_scores, macchinari, documenti_ce, documenti_doganali } from "@/lib/db/schema";
import { eq, desc, sql, count, and, inArray } from "drizzle-orm";
import Link from "next/link";
import {
    AlertTriangle, ArrowRight, Plus,
    ShieldAlert, BookMarked, ChevronRight,
} from "lucide-react";
import { NORMATIVE, isNormativaScadenzaImminente } from "@/lib/normative-config";
import RiskScoreBadge from "@/components/ui/RiskScoreBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import KpiCards, { type KpiItem } from "@/components/dashboard/KpiCards";
import AlertsSection, { type AlertItem } from "@/components/dashboard/AlertsSection";

const RISK_STRIP: Record<string, string> = {
    basso: "bg-green-500",
    medio: "bg-amber-500",
    alto: "bg-orange-500",
    critico: "bg-red-500",
    da_verificare: "bg-slate-600",
};

async function getDashboardData(org_id: string) {
    const [
        pratiche_attive_res,
        pratiche_a_rischio_res,
        pratiche_in_scadenza_res,
        lista,
        activeMacchinariList,
        activePraticheList,
    ] = await Promise.all([
        // Pratiche attive (non bloccate)
        db.select({ count: count() })
            .from(pratiche)
            .where(and(eq(pratiche.organization_id, org_id), sql`${pratiche.stato} NOT IN ('bloccata')`)),

        // Pratiche a rischio alto/critico
        db.select({ count: count() })
            .from(risk_scores)
            .innerJoin(pratiche, eq(risk_scores.pratica_id, pratiche.id))
            .where(and(eq(pratiche.organization_id, org_id), sql`${risk_scores.livello_rischio} IN ('alto', 'critico')`)),

        // Pratiche con arrivo entro 30 giorni
        db.select({ count: count() })
            .from(pratiche)
            .where(and(
                eq(pratiche.organization_id, org_id),
                sql`${pratiche.data_prevista_arrivo} BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`,
                sql`${pratiche.stato} NOT IN ('bloccata', 'approvata')`
            )),

        // Lista ultime 10 pratiche
        db.select({
            id: pratiche.id,
            codice_pratica: pratiche.codice_pratica,
            nome_pratica: pratiche.nome_pratica,
            fornitore_cinese: pratiche.fornitore_cinese,
            stato: pratiche.stato,
            data_prevista_arrivo: pratiche.data_prevista_arrivo,
        })
            .from(pratiche)
            .where(eq(pratiche.organization_id, org_id))
            .orderBy(desc(pratiche.created_at))
            .limit(10),

        // Macchinari attivi — con pratica_id, nome_macchina, codice_pratica
        db.select({
            id: macchinari.id,
            pratica_id: macchinari.pratica_id,
            nome_macchina: macchinari.nome_macchina,
            lunghezza_cm: macchinari.lunghezza_cm,
            codice_pratica: pratiche.codice_pratica,
        })
            .from(macchinari)
            .innerJoin(pratiche, eq(macchinari.pratica_id, pratiche.id))
            .where(and(eq(pratiche.organization_id, org_id), sql`${pratiche.stato} NOT IN ('bloccata', 'approvata')`)),

        // Pratiche attive — con codice + nome
        db.select({
            id: pratiche.id,
            codice_pratica: pratiche.codice_pratica,
            nome_pratica: pratiche.nome_pratica,
        })
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

    // Build ceMap: macId → Set<tipo>
    const ceMap = new Map<string, Set<string>>();
    for (const doc of ceDocs) {
        if (!doc.macchinario_id || !doc.tipo_documento) continue;
        if (!ceMap.has(doc.macchinario_id)) ceMap.set(doc.macchinario_id, new Set());
        ceMap.get(doc.macchinario_id)!.add(doc.tipo_documento);
    }

    // Build doganaliMap: praticaId → Set<tipo>
    const doganaliMap = new Map<string, Set<string>>();
    for (const doc of doganalDocs) {
        if (!doc.pratica_id || !doc.tipo_documento) continue;
        if (!doganaliMap.has(doc.pratica_id)) doganaliMap.set(doc.pratica_id, new Set());
        doganaliMap.get(doc.pratica_id)!.add(doc.tipo_documento);
    }

    // macId → praticaId
    const macPraticaMap = new Map<string, string>();
    for (const m of activeMacchinariList) {
        if (m.id && m.pratica_id) macPraticaMap.set(m.id, m.pratica_id);
    }

    // praticaId → CE count (via macchinario)
    const cePraticaMap = new Map<string, number>();
    for (const [macId, docs] of ceMap) {
        const praticaId = macPraticaMap.get(macId);
        if (praticaId) cePraticaMap.set(praticaId, docs.size);
    }

    // Pratiche da completare (CE o doganali incomplete)
    const da_completare_set = new Set<string>();
    for (const m of activeMacchinariList) {
        if (m.id && m.pratica_id && (ceMap.get(m.id)?.size ?? 0) < 5)
            da_completare_set.add(m.pratica_id);
    }
    for (const p of activePraticheList) {
        if (p.id && (doganaliMap.get(p.id)?.size ?? 0) < 3)
            da_completare_set.add(p.id);
    }

    // Alert per pratica (CE)
    const ceAlerts: AlertItem[] = activeMacchinariList
        .filter(m => m.id && (ceMap.get(m.id)?.size ?? 0) < 5)
        .map(m => ({
            icon: "AlertTriangle" as const,
            color: "text-orange-400",
            title: m.codice_pratica,
            description: `${m.nome_macchina} — ${5 - (ceMap.get(m.id!)?.size ?? 0)} doc. CE mancanti`,
            href: `/pratiche/${m.pratica_id}/compliance-ce`,
            cta: "Vai",
        }));

    // Alert per pratica (doganali)
    const doganaliAlerts: AlertItem[] = activePraticheList
        .filter(p => p.id && (doganaliMap.get(p.id)?.size ?? 0) < 3)
        .map(p => ({
            icon: "AlertTriangle" as const,
            color: "text-yellow-400",
            title: p.codice_pratica,
            description: `${p.nome_pratica} — ${3 - (doganaliMap.get(p.id)?.size ?? 0)} doc. doganali mancanti`,
            href: `/pratiche/${p.id}/documenti-doganali`,
            cta: "Vai",
        }));

    // Latest risk score per pratica
    const listaIds = lista.map(p => p.id);
    const listaScores = listaIds.length > 0
        ? await db.select({
            pratica_id: risk_scores.pratica_id,
            score_globale: risk_scores.score_globale,
            livello_rischio: risk_scores.livello_rischio,
        }).from(risk_scores).where(inArray(risk_scores.pratica_id, listaIds)).orderBy(desc(risk_scores.calcolato_at))
        : [];
    const scoreMap = new Map<string, { score_globale: number | null; livello_rischio: string | null }>();
    for (const s of listaScores) {
        if (s.pratica_id && !scoreMap.has(s.pratica_id)) scoreMap.set(s.pratica_id, s);
    }

    const listaConScore = lista.map(p => ({
        ...p,
        score_globale: scoreMap.get(p.id)?.score_globale ?? null,
        livello_rischio: scoreMap.get(p.id)?.livello_rischio ?? null,
        ce_count: cePraticaMap.get(p.id) ?? 0,
        doganali_count: doganaliMap.get(p.id)?.size ?? 0,
    }));

    return {
        pratiche_attive: pratiche_attive_res[0]?.count ?? 0,
        pratiche_a_rischio: pratiche_a_rischio_res[0]?.count ?? 0,
        pratiche_in_scadenza: pratiche_in_scadenza_res[0]?.count ?? 0,
        pratiche_da_completare: da_completare_set.size,
        lista: listaConScore,
        ceAlerts,
        doganaliAlerts,
    };
}

export default async function DashboardPage() {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;

    const data = org_id ? await getDashboardData(org_id) : null;

    const kpis: KpiItem[] = [
        {
            label: "Pratiche Attive",
            value: data?.pratiche_attive ?? 0,
            icon: "FolderOpen" as const,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            accent: "bg-blue-500",
        },
        {
            label: "Alto / Critico Rischio",
            value: data?.pratiche_a_rischio ?? 0,
            icon: "AlertTriangle" as const,
            color: "text-red-400",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            accent: "bg-red-500",
        },
        {
            label: "In Scadenza (30 gg)",
            value: data?.pratiche_in_scadenza ?? 0,
            icon: "Calendar" as const,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            accent: "bg-amber-500",
        },
        {
            label: "Da Completare",
            value: data?.pratiche_da_completare ?? 0,
            icon: "FileWarning" as const,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            accent: "bg-orange-500",
        },
    ];

    // Build alerts per AlertsSection
    const alerts: AlertItem[] = [];

    // Avviso normativo (se imminente)
    const dirMacchine = NORMATIVE.DIR_2006_42_CE;
    const scadenzaImminente = isNormativaScadenzaImminente(dirMacchine, 365);
    const successore = dirMacchine.successore_id ? NORMATIVE[dirMacchine.successore_id] : null;
    if (scadenzaImminente) {
        alerts.push({
            icon: "BookMarked" as const,
            color: "text-amber-400",
            title: "Normativa",
            description: successore
                ? `${dirMacchine.codice} scade ${dirMacchine.in_vigore_al}. Dal ${successore.in_vigore_dal} entra in vigore ${successore.codice}.`
                : `${dirMacchine.codice} scade il ${dirMacchine.in_vigore_al}. Verifica il registro normativo.`,
            href: "/impostazioni/normative",
            cta: "Dettagli",
        });
    }

    // Alert CE + doganali per pratica specifica
    if (data) {
        alerts.push(...data.ceAlerts, ...data.doganaliAlerts);
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-1">Pannello di controllo</p>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Panoramica compliance import macchinari</p>
                </div>
                <p className="text-xs text-slate-600 hidden sm:block">
                    {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                </p>
            </div>

            {/* KPI Cards */}
            <KpiCards kpis={kpis} />

            {/* No org warning */}
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

            {/* Main: 2 colonne */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

                {/* Sinistra — Lista Pratiche compatta */}
                <div className="glass-card overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
                        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                            Pratiche Recenti
                        </h2>
                        <Link href="/pratiche" className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors duration-150">
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
                        <div className="divide-y divide-slate-700/30">
                            {data.lista.map((p) => {
                                const score = p.score_globale ? Number(p.score_globale) : null;
                                const level = p.livello_rischio ?? "da_verificare";
                                const strip = RISK_STRIP[level] ?? "bg-slate-600";

                                const daysUntil = p.data_prevista_arrivo
                                    ? Math.ceil((new Date(p.data_prevista_arrivo).getTime() - Date.now()) / 86_400_000)
                                    : null;
                                const urgentDate = daysUntil !== null && daysUntil <= 30 && daysUntil >= 0;

                                return (
                                    <Link
                                        key={p.id}
                                        href={`/pratiche/${p.id}`}
                                        className="flex items-stretch gap-3.5 px-4 py-3.5 hover:bg-white/[0.03] transition-all duration-150 group"
                                    >
                                        {/* Strip rischio */}
                                        <div className={`w-1 rounded-full shrink-0 ${strip}`} />

                                        {/* Info principale */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0">
                                                    {p.codice_pratica}
                                                </span>
                                                <span className="text-sm font-medium text-white truncate">{p.nome_pratica}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                                                {p.fornitore_cinese && <span className="truncate max-w-[120px]">{p.fornitore_cinese}</span>}
                                                {p.fornitore_cinese && p.data_prevista_arrivo && <span>·</span>}
                                                {p.data_prevista_arrivo && (
                                                    <span className={urgentDate ? "text-amber-400 font-medium" : ""}>
                                                        {formatDate(p.data_prevista_arrivo)}
                                                        {daysUntil !== null && daysUntil >= 0 && daysUntil <= 60 && ` (${daysUntil}gg)`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Indicatori documentali + badge */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            {/* CE dots */}
                                            <div className="hidden sm:flex items-center gap-0.5">
                                                <span className="text-[9px] text-slate-600 mr-1 font-medium">CE</span>
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= p.ce_count ? "bg-green-500" : "bg-slate-700"}`} />
                                                ))}
                                            </div>
                                            {/* Doc dots */}
                                            <div className="hidden sm:flex items-center gap-0.5">
                                                <span className="text-[9px] text-slate-600 mr-1 font-medium">Doc</span>
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= p.doganali_count ? "bg-green-500" : "bg-slate-700"}`} />
                                                ))}
                                            </div>

                                            <StatusBadge stato={p.stato} />

                                            {score !== null
                                                ? <RiskScoreBadge score={score} level={level} size="sm" />
                                                : <span className="text-[10px] text-slate-600">—</span>
                                            }

                                            <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Destra — Azioni + Avvisi + Normativa */}
                <div className="space-y-4">

                    {/* 1. CTA Nuova Pratica — in cima */}
                    <Link
                        href="/pratiche/nuova"
                        className="group flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 hover:-translate-y-px"
                    >
                        <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
                        Nuova Pratica
                    </Link>

                    {/* 2. Avvisi per pratica — collassabili */}
                    <AlertsSection alerts={alerts} />

                    {/* 3. Stato Normativo */}
                    <div className="glass-card p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-3">Stato Normativo</p>
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Direttiva attiva</span>
                                <span className="text-green-400 font-medium">Dir. 2006/42/CE</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Nuovo regolamento</span>
                                <span className="text-slate-300 font-medium">20/01/2027</span>
                            </div>
                            <div className="h-px bg-slate-700/50" />
                            <Link
                                href="/impostazioni/normative"
                                className="flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition"
                            >
                                <span>Registro normative</span>
                                <BookMarked className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
