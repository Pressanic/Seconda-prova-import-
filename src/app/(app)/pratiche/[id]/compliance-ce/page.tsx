import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, macchinari, documenti_ce, organismi_notificati, componenti_aggiuntivi } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    FileText, CheckCircle, XCircle, AlertTriangle, Circle,
    Shield, ExternalLink, ChevronRight, Info
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import DocumentUploadModal from "@/components/forms/DocumentUploadModal";

// ─── Document types ──────────────────────────────────────────────────────────

interface DocType {
    tipo: string;
    label: string;
    ref: string;
    required: boolean;
    hint?: string;
    children?: DocType[];
    conditional?: boolean;
}

function buildDocTypes(macchinario: {
    tipo_azionamento?: string | null;
    sistemi_pneumatici_ausiliari?: boolean | null;
    stato_macchina: string;
}): DocType[] {
    const isIdraulico = macchinario.tipo_azionamento === "idraulico" || macchinario.tipo_azionamento === "ibrido";
    const isPneumatico = macchinario.sistemi_pneumatici_ausiliari === true;
    const isUsata = macchinario.stato_macchina === "usata";

    return [
        {
            tipo: "dichiarazione_ce",
            label: "Dichiarazione CE di Conformità",
            ref: "Dir. 2006/42/CE, All. II — EN ISO 20430:2020",
            required: true,
            hint: "Deve citare EN ISO 20430:2020 (norma specifica presse ad iniezione) e ISO 12100:2010",
        },
        {
            tipo: "manuale_uso",
            label: "Manuale d'Uso in lingua italiana",
            ref: "Dir. 2006/42/CE, Art. 10",
            required: true,
            hint: "Obbligatorio in italiano per destinazione IT/UE",
        },
        {
            tipo: "fascicolo_tecnico",
            label: "Fascicolo Tecnico",
            ref: "Dir. 2006/42/CE, All. VII",
            required: true,
            hint: "Documento contenitore — deve includere tutti i sotto-documenti seguenti",
            children: [
                {
                    tipo: "analisi_rischi",
                    label: isUsata ? "Analisi dei Rischi (aggiornata per macchina usata)" : "Analisi dei Rischi",
                    ref: "ISO 12100:2010",
                    required: true,
                    hint: isUsata ? "Per macchina usata è necessaria una nuova valutazione dei rischi" : "Valutazione sistematica di tutti i rischi residui",
                },
                {
                    tipo: "schemi_elettrici",
                    label: "Schemi Elettrici",
                    ref: "CEI EN 60204-1",
                    required: true,
                    hint: "Schemi del quadro elettrico e cablaggi",
                },
                ...(isIdraulico ? [{
                    tipo: "schemi_idraulici",
                    label: "Schemi Idraulici",
                    ref: "EN ISO 4413",
                    required: true,
                    hint: "Obbligatori per azionamento idraulico/ibrido",
                    conditional: true,
                }] : []),
                ...(isPneumatico ? [{
                    tipo: "schemi_pneumatici",
                    label: "Schemi Pneumatici",
                    ref: "EN ISO 4414",
                    required: false,
                    hint: "Richiesti per sistemi pneumatici ausiliari",
                    conditional: true,
                }] : []),
            ],
        },
    ];
}

// ─── Score calc ───────────────────────────────────────────────────────────────

function calcCEScore(
    docTypes: DocType[],
    docsByTipo: Record<string, any>,
    macchinario: { stato_macchina: string },
    componentiCE: any[],
    docsComponenti: Record<string, any[]>,
): number {
    let score = 100;
    const penalty = (pts: number) => { score -= pts; };

    function checkDocs(types: DocType[]) {
        for (const dt of types) {
            const doc = docsByTipo[dt.tipo];
            if (!doc) {
                penalty(dt.required ? 15 : 5);
            } else if (doc.stato_validazione === "non_valido") {
                penalty(dt.required ? 10 : 3);
            }
            if (dt.children) checkDocs(dt.children);
        }
    }
    checkDocs(docTypes);

    // EN ISO 20430 check (specific for injection presses)
    const dichCe = docsByTipo["dichiarazione_ce"];
    if (dichCe) {
        const norme: string[] = (dichCe.norme_armonizzate as string[]) ?? [];
        const hasISO20430 = norme.some(n => n.includes("20430"));
        if (!hasISO20430) penalty(15);
    }

    // Usata: analisi rischi extra weight
    if (macchinario.stato_macchina === "usata" && !docsByTipo["analisi_rischi"]) {
        penalty(10); // extra penalty on top of the 15 above
    }

    // Component CE docs
    for (const comp of componentiCE) {
        const compDocs = docsComponenti[comp.id] ?? [];
        const hasDich = compDocs.some((d: any) => d.tipo_documento === "dichiarazione_ce" && d.stato_validazione !== "non_valido");
        if (!hasDich) penalty(10);
    }

    return Math.max(0, score);
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATO_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    valido: { icon: CheckCircle, color: "text-green-400", label: "Valido" },
    non_valido: { icon: XCircle, color: "text-red-400", label: "Non Valido" },
    attenzione: { icon: AlertTriangle, color: "text-yellow-400", label: "Attenzione" },
    da_verificare: { icon: Circle, color: "text-slate-500", label: "Da Verificare" },
};

// ─── Doc row component ────────────────────────────────────────────────────────

function DocRow({
    dt, doc, praticaId, macchinarioId, indent = false, componenteId,
}: {
    dt: DocType;
    doc: any;
    praticaId: string;
    macchinarioId: string;
    indent?: boolean;
    componenteId?: string;
}) {
    const stato = doc?.stato_validazione ?? "da_verificare";
    const { icon: Icon, color, label: statoLabel } = STATO_CONFIG[stato] ?? STATO_CONFIG.da_verificare;
    const anomalie = ((doc?.anomalie_rilevate as any[]) ?? []).filter((a: any) => a.messaggio || a.message);
    const norme: string[] = (doc?.norme_armonizzate as string[]) ?? [];
    const missingISO20430 = dt.tipo === "dichiarazione_ce" && doc && !norme.some(n => n.includes("20430"));

    return (
        <div className={`px-6 py-4 ${indent ? "pl-12 bg-slate-900/20" : ""}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {indent && <ChevronRight className="w-3.5 h-3.5 text-slate-600 mt-1 shrink-0" />}
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium text-white ${indent ? "text-xs" : ""}`}>{dt.label}</p>
                            {dt.required && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Obbligatorio</span>}
                            {dt.conditional && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Condizionale</span>}
                            <span className="text-[10px] text-slate-500">{dt.ref}</span>
                        </div>

                        {dt.hint && !doc && (
                            <p className="text-xs text-slate-600 mt-0.5">{dt.hint}</p>
                        )}

                        {doc ? (
                            <div className="mt-1.5 space-y-1.5">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <p className="text-xs text-slate-400">
                                        {doc.nome_file}
                                        {doc.uploaded_at && <> — {formatDate(doc.uploaded_at?.toString())}</>}
                                    </p>
                                    {doc.url_storage && (
                                        <a href={doc.url_storage} target="_blank" rel="noopener noreferrer"
                                            className="text-xs text-blue-400 hover:text-blue-300 underline shrink-0 transition">
                                            Visualizza ↗
                                        </a>
                                    )}
                                </div>

                                {/* Norme armonizzate badges */}
                                {norme.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {norme.map((n, i) => (
                                            <span key={i}
                                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${n.includes("20430") ? "bg-green-500/15 text-green-400 border border-green-500/20" : "bg-slate-700/60 text-slate-400"}`}>
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* EN ISO 20430 missing warning */}
                                {missingISO20430 && (
                                    <div className="flex items-center gap-1.5 text-xs text-orange-400">
                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                        EN ISO 20430:2020 non rilevata — norma specifica obbligatoria per presse ad iniezione
                                    </div>
                                )}

                                {anomalie.map((a: any, i: number) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-yellow-400">
                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                        {a.messaggio ?? a.message ?? a}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-600 mt-0.5">Documento non ancora caricato</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${color}`}>{statoLabel}</span>
                    <DocumentUploadModal
                        category="ce"
                        praticaId={praticaId}
                        macchinarioId={macchinarioId}
                        tipoDocumento={dt.tipo}
                        tipoLabel={dt.label}
                        existingId={doc?.id}
                        componenteId={componenteId}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ComplianceCEPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) notFound();

    const [macchinario] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);

    const docs = macchinario
        ? await db.select().from(documenti_ce).where(eq(documenti_ce.macchinario_id, macchinario.id))
        : [];

    const organismi = macchinario
        ? await db.select().from(organismi_notificati).where(eq(organismi_notificati.macchinario_id, macchinario.id))
        : [];

    // Componenti that require CE marking
    const componentiCE = macchinario
        ? await db.select().from(componenti_aggiuntivi)
            .where(and(eq(componenti_aggiuntivi.macchinario_id, macchinario.id), eq(componenti_aggiuntivi.ha_marcatura_ce, true)))
        : [];

    const docsByTipo = Object.fromEntries(
        docs.filter(d => !d.componente_id).map(d => [d.tipo_documento, d])
    );

    // Docs grouped by componente_id
    const docsComponenti: Record<string, any[]> = {};
    for (const d of docs.filter(d => d.componente_id)) {
        const key = d.componente_id!;
        if (!docsComponenti[key]) docsComponenti[key] = [];
        docsComponenti[key].push(d);
    }

    const docTypes = macchinario ? buildDocTypes(macchinario) : [];
    const ceScore = macchinario ? calcCEScore(docTypes, docsByTipo, macchinario, componentiCE, docsComponenti) : 0;

    // Count present docs (flat)
    function flatDocs(types: DocType[]): string[] {
        return types.flatMap(t => [t.tipo, ...(t.children ? flatDocs(t.children) : [])]);
    }
    const allTypes = flatDocs(docTypes);
    const presentCount = allTypes.filter(t => docsByTipo[t]).length;

    return (
        <div className="space-y-5">
            {/* Score summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-4 border border-blue-500/20">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Score CE</p>
                    <p className={`text-3xl font-bold mt-1 ${ceScore >= 80 ? "text-green-400" : ceScore >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                        {macchinario ? `${ceScore}/100` : "—"}
                    </p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Documenti Presenti</p>
                    <p className="text-3xl font-bold mt-1 text-white">
                        {macchinario ? `${presentCount}/${allTypes.length}` : "—"}
                    </p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Organismo Notificato</p>
                    <p className={`text-sm font-semibold mt-2 ${organismi[0]?.stato_verifica === "valido" ? "text-green-400" : "text-slate-400"}`}>
                        {organismi[0] ? organismi[0].nome_organismo ?? organismi[0].numero_organismo : "Non verificato"}
                    </p>
                </div>
            </div>

            {/* Reference notice */}
            <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-lg px-4 py-3">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-400 space-y-0.5">
                    <p className="font-medium text-blue-300">Normativa applicabile: Dir. 2006/42/CE (Direttiva Macchine)</p>
                    <p>Norma specifica presse ad iniezione: <span className="text-white font-mono">EN ISO 20430:2020</span>. Il Reg. UE 2023/1230 entrerà in vigore il 20/01/2027.</p>
                </div>
            </div>

            {/* Document checklist */}
            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <h2 className="text-base font-semibold text-white">Documenti CE</h2>
                </div>

                {!macchinario && (
                    <div className="p-6">
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-300">
                            ⚠️ Aggiungi prima i dati del macchinario per procedere con i documenti CE.
                            <Link href={`/pratiche/${id}/macchinario`} className="ml-2 underline">Aggiungi macchinario →</Link>
                        </div>
                    </div>
                )}

                {macchinario && (
                    <div className="divide-y divide-slate-700/40">
                        {docTypes.map(dt => (
                            <div key={dt.tipo}>
                                <DocRow
                                    dt={dt}
                                    doc={docsByTipo[dt.tipo]}
                                    praticaId={id}
                                    macchinarioId={macchinario.id}
                                />
                                {/* Children (fascicolo tecnico sub-docs) */}
                                {dt.children && dt.children.map(child => (
                                    <div key={child.tipo} className="border-t border-slate-700/20">
                                        <DocRow
                                            dt={child}
                                            doc={docsByTipo[child.tipo]}
                                            praticaId={id}
                                            macchinarioId={macchinario.id}
                                            indent={true}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Component CE section */}
            {macchinario && componentiCE.length > 0 && (
                <div className="glass-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <h2 className="text-base font-semibold text-white">CE per Componenti Aggiuntivi</h2>
                    </div>
                    <div className="divide-y divide-slate-700/40">
                        {componentiCE.map(comp => {
                            const compDocs = docsComponenti[comp.id] ?? [];
                            const dichComp = compDocs.find((d: any) => d.tipo_documento === "dichiarazione_ce");
                            const stato = dichComp?.stato_validazione ?? "da_verificare";
                            const { icon: Icon, color, label: statoLabel } = STATO_CONFIG[stato] ?? STATO_CONFIG.da_verificare;

                            return (
                                <div key={comp.id} className="px-6 py-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                                            <div>
                                                <p className="text-sm font-medium text-white">{comp.descrizione}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {comp.marca && <span className="text-xs text-slate-400">{comp.marca}</span>}
                                                    {comp.modello && <span className="text-xs text-slate-400">{comp.modello}</span>}
                                                    {comp.numero_seriale && <span className="text-xs text-slate-500 font-mono">S/N: {comp.numero_seriale}</span>}
                                                </div>
                                                {dichComp ? (
                                                    <div className="mt-1 flex items-center gap-3">
                                                        <p className="text-xs text-slate-400">{dichComp.nome_file}</p>
                                                        {dichComp.url_storage && (
                                                            <a href={dichComp.url_storage} target="_blank" rel="noopener noreferrer"
                                                                className="text-xs text-blue-400 hover:text-blue-300 underline transition">
                                                                Visualizza ↗
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-orange-400 mt-1">Dichiarazione CE del componente mancante</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-xs font-medium ${color}`}>{statoLabel}</span>
                                            <DocumentUploadModal
                                                category="ce"
                                                praticaId={id}
                                                macchinarioId={macchinario.id}
                                                tipoDocumento="dichiarazione_ce"
                                                tipoLabel={`CE — ${comp.descrizione}`}
                                                existingId={dichComp?.id}
                                                componenteId={comp.id}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Notified Body */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-blue-400" /> Organismo Notificato
                    </h2>
                    {macchinario && (
                        <Link href={`/pratiche/${id}/compliance-ce/organismo`}
                            className="text-sm text-blue-400 hover:text-blue-300 transition">
                            Gestisci →
                        </Link>
                    )}
                </div>
                {organismi[0] ? (
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${organismi[0].stato_verifica === "valido" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                            {organismi[0].stato_verifica === "valido"
                                ? <CheckCircle className="w-5 h-5 text-green-400" />
                                : <XCircle className="w-5 h-5 text-red-400" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{organismi[0].nome_organismo ?? organismi[0].numero_organismo}</p>
                            <p className="text-xs text-slate-400">
                                Numero: {organismi[0].numero_organismo} — Verificato: {formatDate(organismi[0].verificato_at?.toString())}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">
                        {macchinario ? "Nessun organismo notificato registrato" : "Aggiungi prima il macchinario"}
                    </p>
                )}
            </div>
        </div>
    );
}
