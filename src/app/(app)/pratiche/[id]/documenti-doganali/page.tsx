import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, documenti_doganali, macchinari } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckCircle, Circle, XCircle, Minus, Package, FileText, Ship } from "lucide-react";
import { formatDate } from "@/lib/utils";
import DocumentUploadModal from "@/components/forms/DocumentUploadModal";

const DOC_TYPES = [
    { tipo: "bill_of_lading", label: "Bill of Lading (OBL)", required: true, icon: Ship },
    { tipo: "fattura_commerciale", label: "Fattura Commerciale", required: true, icon: FileText },
    { tipo: "packing_list", label: "Packing List", required: true, icon: Package },
    { tipo: "certificato_origine", label: "Certificato di Origine", required: false, icon: FileText },
    { tipo: "insurance_certificate", label: "Insurance Certificate", required: false, icon: FileText },
];

type CheckResult = { stato: "ok" | "ko" | "nd"; messaggio: string; dettaglio?: string };

function checkHSCoerenza(docs: Record<string, any>, macchinario: any): CheckResult {
    const bl = docs["bill_of_lading"];
    const fattura = docs["fattura_commerciale"];
    const hsSelezionato = macchinario?.codice_taric_selezionato;

    const codici = [
        bl?.codice_hs_nel_doc,
        fattura?.codice_hs_nel_doc,
    ].filter(Boolean);

    if (codici.length === 0) return { stato: "nd", messaggio: "Nessun codice HS nei documenti" };

    const prefix6 = (c: string) => c.replace(/\./g, "").slice(0, 6);
    const tutti = hsSelezionato ? [...codici, hsSelezionato] : codici;
    const normalizzati = tutti.map(prefix6);
    const coerenti = normalizzati.every(c => c === normalizzati[0]);

    if (coerenti) return { stato: "ok", messaggio: `Codice HS coerente: ${normalizzati[0]}` };
    return { stato: "ko", messaggio: "Codici HS non coerenti tra i documenti", dettaglio: normalizzati.join(" vs ") };
}

function checkPesiCoerenza(docs: Record<string, any>): CheckResult {
    const bl = docs["bill_of_lading"];
    const pl = docs["packing_list"];

    if (!bl?.peso_doc_kg || !pl?.peso_doc_kg) return { stato: "nd", messaggio: "Peso non disponibile in tutti i documenti" };

    const pesoBL = Number(bl.peso_doc_kg);
    const pesoPL = Number(pl.peso_doc_kg);
    const diff = Math.abs(pesoBL - pesoPL) / Math.max(pesoBL, pesoPL);

    if (diff <= 0.05) return { stato: "ok", messaggio: `Pesi coerenti (BL: ${pesoBL} kg, PL: ${pesoPL} kg)` };
    return { stato: "ko", messaggio: `Discrepanza pesi superiore al 5%`, dettaglio: `BL: ${pesoBL} kg vs PL: ${pesoPL} kg (diff: ${(diff * 100).toFixed(1)}%)` };
}

function checkFatturaCompleta(docs: Record<string, any>): CheckResult {
    const fattura = docs["fattura_commerciale"];
    if (!fattura) return { stato: "nd", messaggio: "Fattura commerciale non caricata" };

    const mancanti: string[] = [];
    if (!fattura.valore_commerciale) mancanti.push("valore commerciale");
    if (!fattura.valuta) mancanti.push("valuta");
    if (!fattura.codice_hs_nel_doc) mancanti.push("codice HS");

    if (mancanti.length === 0) return { stato: "ok", messaggio: `Fattura completa — ${fattura.valore_commerciale} ${fattura.valuta}` };
    return { stato: "ko", messaggio: "Dati mancanti in fattura", dettaglio: `Mancanti: ${mancanti.join(", ")}` };
}

function checkDescrizionePresente(docs: Record<string, any>): CheckResult {
    const docsConDescrizione = Object.values(docs).filter((d: any) => d?.descrizione_merce_doc);
    if (docsConDescrizione.length === 0) return { stato: "nd", messaggio: "Nessuna descrizione merce nei documenti" };
    const desc = (docsConDescrizione[0] as any).descrizione_merce_doc;
    return { stato: "ok", messaggio: "Descrizione merce presente", dettaglio: desc };
}

export default async function DocumentiDoganaliPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) notFound();

    const docs = await db.select().from(documenti_doganali).where(eq(documenti_doganali.pratica_id, id));
    const docsByTipo = Object.fromEntries(docs.map(d => [d.tipo_documento, d]));
    const [macchinario] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);

    const required = ["bill_of_lading", "fattura_commerciale", "packing_list"];
    const present = required.filter(t => docsByTipo[t]);
    const dgScore = Math.max(0, 100 - (required.length - present.length) * 25);

    // Real cross-checks
    const checks: { id: string; label: string; result: CheckResult }[] = [
        { id: "CHECK 1", label: "Codice HS coerente tra BL, Fattura e Sistema", result: checkHSCoerenza(docsByTipo, macchinario) },
        { id: "CHECK 2", label: "Descrizione merce presente nei documenti", result: checkDescrizionePresente(docsByTipo) },
        { id: "CHECK 3", label: "Pesi coerenti tra BL e Packing List (±5%)", result: checkPesiCoerenza(docsByTipo) },
        { id: "CHECK 4", label: "Dati obbligatori fattura: valore, valuta, codice HS", result: checkFatturaCompleta(docsByTipo) },
    ];

    const checkIcon = (stato: CheckResult["stato"]) => {
        if (stato === "ok") return <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />;
        if (stato === "ko") return <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />;
        return <Minus className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />;
    };

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
                                            <div className="mt-0.5 flex items-center gap-3 flex-wrap">
                                                <span className="text-xs text-slate-400">
                                                    {doc.nome_file} — {formatDate(doc.uploaded_at?.toString())}
                                                    {doc.valore_commerciale && <span className="ml-2">Valore: {doc.valore_commerciale} {doc.valuta}</span>}
                                                </span>
                                                {doc.url_storage && (
                                                    <a href={doc.url_storage} target="_blank" rel="noopener noreferrer"
                                                       className="text-xs text-blue-400 hover:text-blue-300 underline shrink-0 transition">
                                                        Visualizza ↗
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DocumentUploadModal category="doganale" praticaId={id} tipoDocumento={tipo} tipoLabel={label} existingId={doc?.id} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Real cross-checks */}
            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700">
                    <h3 className="text-base font-semibold text-white">Controlli di Coerenza Incrociata</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Verifiche automatiche sui dati inseriti nei documenti</p>
                </div>
                <div className="divide-y divide-slate-700/40">
                    {checks.map(({ id: checkId, label, result }) => (
                        <div key={checkId} className="flex items-start gap-4 px-6 py-4">
                            {checkIcon(result.stato)}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <code className="text-[10px] text-blue-400 font-mono shrink-0">{checkId}</code>
                                    <p className="text-sm text-slate-300">{label}</p>
                                </div>
                                <p className={`text-xs mt-0.5 ${result.stato === "ok" ? "text-green-400" : result.stato === "ko" ? "text-red-400" : "text-slate-600"}`}>
                                    {result.messaggio}
                                </p>
                                {result.dettaglio && (
                                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{result.dettaglio}</p>
                                )}
                            </div>
                            <span className={`text-xs font-medium shrink-0 px-2 py-0.5 rounded ${
                                result.stato === "ok" ? "bg-green-500/10 text-green-400" :
                                result.stato === "ko" ? "bg-red-500/10 text-red-400" :
                                "bg-slate-700 text-slate-500"
                            }`}>
                                {result.stato === "ok" ? "OK" : result.stato === "ko" ? "FAIL" : "N/D"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
