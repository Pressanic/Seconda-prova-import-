import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, documenti_doganali } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckCircle, Circle, Upload, Package, FileText, Ship } from "lucide-react";
import { formatDate } from "@/lib/utils";
import DoganaliUploadForm from "@/components/forms/DoganaliUploadForm";

const DOC_TYPES = [
    { tipo: "bill_of_lading", label: "Bill of Lading (OBL)", required: true, icon: Ship },
    { tipo: "fattura_commerciale", label: "Fattura Commerciale", required: true, icon: FileText },
    { tipo: "packing_list", label: "Packing List", required: true, icon: Package },
    { tipo: "certificato_origine", label: "Certificato di Origine", required: false, icon: FileText },
    { tipo: "insurance_certificate", label: "Insurance Certificate", required: false, icon: FileText },
];

export default async function DocumentiDoganaliPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) notFound();

    const docs = await db.select().from(documenti_doganali).where(eq(documenti_doganali.pratica_id, id));
    const docsByTipo = Object.fromEntries(docs.map(d => [d.tipo_documento, d]));

    const required = ["bill_of_lading", "fattura_commerciale", "packing_list"];
    const present = required.filter(t => docsByTipo[t]);
    const dgScore = Math.max(0, 100 - (required.length - present.length) * 25);

    return (
        <div className="space-y-5">
            {/* Score */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 border border-slate-700">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Score Doganale</p>
                    <p className={`text-3xl font-bold mt-1 ${dgScore >= 80 ? "text-green-400" : dgScore >= 60 ? "text-yellow-400" : "text-red-400"}`}>{dgScore}/100</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Obbligatori</p>
                    <p className="text-3xl font-bold mt-1 text-white">{present.length}/{required.length}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Totale Caricati</p>
                    <p className="text-3xl font-bold mt-1 text-white">{docs.length}</p>
                </div>
            </div>

            {/* Documents */}
            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700">
                    <h2 className="text-base font-semibold text-white">Documenti di Trasporto</h2>
                </div>
                <div className="divide-y divide-slate-700/40">
                    {DOC_TYPES.map(({ tipo, label, required, icon: Icon }) => {
                        const doc = docsByTipo[tipo];
                        return (
                            <div key={tipo} className="flex items-center justify-between px-6 py-4 gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    {doc ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0" /> : <Circle className="w-5 h-5 text-slate-600 shrink-0" />}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-white">{label}</p>
                                            {required && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Obbligatorio</span>}
                                        </div>
                                        {doc && (
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {doc.nome_file} — {formatDate(doc.uploaded_at?.toString())}
                                                {doc.valore_commerciale && <span className="ml-2">Valore: {doc.valore_commerciale} {doc.valuta}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DoganaliUploadForm praticaId={id} tipoDocumento={tipo} existingId={doc?.id} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cross-check info */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Controlli di Coerenza Incrociata</h3>
                <div className="space-y-2 text-sm text-slate-400">
                    <p className="flex items-start gap-2"><span className="text-blue-400 font-mono text-xs shrink-0 mt-0.5">CHECK 1</span> Codice HS coerente tra BL, Fattura e Sistema</p>
                    <p className="flex items-start gap-2"><span className="text-blue-400 font-mono text-xs shrink-0 mt-0.5">CHECK 2</span> Descrizione merce coerente tra documenti e anagrafica</p>
                    <p className="flex items-start gap-2"><span className="text-blue-400 font-mono text-xs shrink-0 mt-0.5">CHECK 3</span> Quantità e pesi coerenti (tolleranza ±5%)</p>
                    <p className="flex items-start gap-2"><span className="text-blue-400 font-mono text-xs shrink-0 mt-0.5">CHECK 4</span> Dati obbligatori fattura: esportatore, importatore, Incoterms, paese origine</p>
                </div>
            </div>
        </div>
    );
}
