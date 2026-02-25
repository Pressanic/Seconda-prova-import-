import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, macchinari, documenti_ce, organismi_notificati } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    FileText, Upload, CheckCircle, XCircle, AlertTriangle, Circle,
    Shield, ExternalLink
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import CEDocumentUploadForm from "@/components/forms/CEDocumentUploadForm";

const DOC_TYPES = [
    { tipo: "dichiarazione_ce", label: "Dichiarazione CE di Conformità", ref: "Reg. UE 2023/1230, All. IV", required: true },
    { tipo: "manuale_uso", label: "Manuale d'uso (in italiano)", ref: "Reg. UE 2023/1230, Art. 10", required: true },
    { tipo: "fascicolo_tecnico", label: "Fascicolo Tecnico", ref: "Reg. UE 2023/1230, All. VII", required: true },
    { tipo: "analisi_rischi", label: "Analisi dei Rischi", ref: "ISO 12100:2010", required: true },
    { tipo: "schemi_elettrici", label: "Schemi Elettrici", ref: "CEI EN 60204-1", required: true },
    { tipo: "certificazione_componente", label: "Certificazioni Componenti", ref: "—", required: false },
];

const STATO_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    valido: { icon: CheckCircle, color: "text-green-400", label: "Valido" },
    non_valido: { icon: XCircle, color: "text-red-400", label: "Non Valido" },
    attenzione: { icon: AlertTriangle, color: "text-yellow-400", label: "Attenzione" },
    da_verificare: { icon: Circle, color: "text-slate-500", label: "Da Verificare" },
};

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

    const docsByTipo = Object.fromEntries(docs.map(d => [d.tipo_documento, d]));

    // Calculate CE score
    const required = ["dichiarazione_ce", "manuale_uso", "fascicolo_tecnico", "analisi_rischi", "schemi_elettrici"];
    const present = required.filter(t => docsByTipo[t]);
    const missingCount = required.length - present.length;
    const ceScore = Math.max(0, 100 - missingCount * 20);

    return (
        <div className="space-y-5">
            {/* CE Score summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-4 border border-blue-500/20">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Score CE</p>
                    <p className={`text-3xl font-bold mt-1 ${ceScore >= 80 ? "text-green-400" : ceScore >= 60 ? "text-yellow-400" : "text-red-400"}`}>{ceScore}/100</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Documenti Presenti</p>
                    <p className="text-3xl font-bold mt-1 text-white">{present.length}/{required.length}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Organismo Notificato</p>
                    <p className={`text-sm font-semibold mt-2 ${organismi[0]?.stato_verifica === "valido" ? "text-green-400" : "text-slate-400"}`}>
                        {organismi[0] ? organismi[0].nome_organismo ?? organismi[0].numero_organismo : "Non verificato"}
                    </p>
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
                        {DOC_TYPES.map(({ tipo, label, ref, required }) => {
                            const doc = docsByTipo[tipo];
                            const stato = doc?.stato_validazione ?? "da_verificare";
                            const { icon: Icon, color, label: statoLabel } = STATO_CONFIG[stato] ?? STATO_CONFIG.da_verificare;
                            const anomalie = (doc?.anomalie_rilevate as any[]) ?? [];

                            return (
                                <div key={tipo} className="px-6 py-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${color}`} />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-white">{label}</p>
                                                    {required && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Obbligatorio</span>}
                                                    <span className="text-[10px] text-slate-500">{ref}</span>
                                                </div>
                                                {doc ? (
                                                    <div className="mt-1">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <p className="text-xs text-slate-400">{doc.nome_file} — caricato il {formatDate(doc.uploaded_at?.toString())}</p>
                                                            {doc.url_storage && (
                                                                <a href={doc.url_storage} target="_blank" rel="noopener noreferrer"
                                                                   className="text-xs text-blue-400 hover:text-blue-300 underline shrink-0 transition">
                                                                    Visualizza ↗
                                                                </a>
                                                            )}
                                                        </div>
                                                        {anomalie.length > 0 && (
                                                            <div className="mt-2 space-y-1">
                                                                {anomalie.map((a: any, i: number) => (
                                                                    <div key={i} className="flex items-center gap-1.5 text-xs text-yellow-400">
                                                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                                                        {a.messaggio ?? a.message ?? a}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-600 mt-0.5">Documento non ancora caricato</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-xs font-medium ${color}`}>{statoLabel}</span>
                                            {macchinario && (
                                                <CEDocumentUploadForm
                                                    praticaId={id}
                                                    macchinarioId={macchinario.id}
                                                    tipoDocumento={tipo}
                                                    existingId={doc?.id}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Notified Body */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-blue-400" /> Organismo Notificato
                    </h2>
                    <Link href={`/pratiche/${id}/compliance-ce/organismo`} className="text-sm text-blue-400 hover:text-blue-300 transition">
                        Gestisci →
                    </Link>
                </div>
                {organismi[0] ? (
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${organismi[0].stato_verifica === "valido" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                            {organismi[0].stato_verifica === "valido" ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{organismi[0].nome_organismo ?? organismi[0].numero_organismo}</p>
                            <p className="text-xs text-slate-400">Numero: {organismi[0].numero_organismo} — Verificato: {formatDate(organismi[0].verificato_at?.toString())}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">Nessun organismo notificato registrato</p>
                )}
            </div>
        </div>
    );
}
