"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    BookMarked,
    ExternalLink,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    User,
    Bot,
    Loader2,
} from "lucide-react";
import {
    NORMATIVE,
    HS_CODICI,
    giorniDaUltimaVerifica,
    isVerificaScaduta,
    type NormativaRef,
    type CodiceHSRef,
} from "@/lib/normative-config";

// ─── Tipi ─────────────────────────────────────────────────────────────────────

interface EurLexCheckResult {
    id?: string;
    codice?: string;
    celex: string;
    in_force: boolean | null;
    date_end_of_validity: string | null;
    error?: string;
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ norm }: { norm: NormativaRef }) {
    const map: Record<string, { label: string; cls: string }> = {
        in_vigore:     { label: "In vigore",     cls: "bg-green-500/15 text-green-400 border border-green-500/30" },
        in_vigore_dal: { label: "In vigore dal…", cls: "bg-blue-500/15 text-blue-400 border border-blue-500/30" },
        abrogata:      { label: "Abrogata",       cls: "bg-red-500/15 text-red-400 border border-red-500/30" },
        da_verificare: { label: "Da verificare",  cls: "bg-amber-500/15 text-amber-400 border border-amber-500/30" },
    };
    const { label, cls } = map[norm.status] ?? map.da_verificare;
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function VerificaBadge({ norm, eurlex }: { norm: NormativaRef; eurlex?: EurLexCheckResult }) {
    const scaduta = isVerificaScaduta(norm);
    const giorni  = giorniDaUltimaVerifica(norm);

    if (eurlex) {
        if (eurlex.error) {
            return (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    Errore: {eurlex.error}
                </span>
            );
        }
        if (eurlex.in_force === true) {
            return (
                <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    EUR-Lex: in vigore
                    {eurlex.date_end_of_validity && ` (fino al ${eurlex.date_end_of_validity})`}
                </span>
            );
        }
        if (eurlex.in_force === false) {
            return (
                <span className="flex items-center gap-1 text-xs text-red-400">
                    <XCircle className="w-3 h-3" />
                    EUR-Lex: NON in vigore
                    {eurlex.date_end_of_validity && ` (scaduta il ${eurlex.date_end_of_validity})`}
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 text-xs text-slate-400">
                <AlertTriangle className="w-3 h-3" />
                EUR-Lex: nessun dato
            </span>
        );
    }

    return (
        <span className={`flex items-center gap-1 text-xs ${scaduta ? "text-amber-400" : "text-slate-400"}`}>
            <Clock className="w-3 h-3" />
            {scaduta ? `Verifica scaduta (${giorni}gg fa)` : `Verificato ${giorni}gg fa`}
            {" · "}
            {norm.verificato_da.startsWith("auto") ? (
                <><Bot className="w-3 h-3" /> auto</>
            ) : (
                <><User className="w-3 h-3" /> {norm.verificato_da.replace("human:", "")}</>
            )}
        </span>
    );
}

// ─── Riga normativa ────────────────────────────────────────────────────────────

function NormRow({
    norm,
    eurlex,
}: {
    norm: NormativaRef;
    eurlex?: EurLexCheckResult;
}) {
    const scaduta = isVerificaScaduta(norm);

    return (
        <div className={`p-4 rounded-lg border ${scaduta ? "border-amber-500/30 bg-amber-500/5" : "border-slate-700/50 bg-slate-800/40"}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-mono font-semibold text-white">{norm.codice}</span>
                        <StatusBadge norm={norm} />
                        {norm.in_vigore_dal && (
                            <span className="text-xs text-slate-500">
                                dal {norm.in_vigore_dal}
                                {norm.in_vigore_al && ` al ${norm.in_vigore_al}`}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400">{norm.nome}</p>
                    {norm.note && <p className="text-xs text-slate-500 mt-0.5 italic">{norm.note}</p>}
                    <div className="mt-1.5">
                        <VerificaBadge norm={norm} eurlex={eurlex} />
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {norm.verifica_metodo === "human" && norm.url_verifica && (
                        <a
                            href={norm.url_verifica}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                        >
                            <ExternalLink className="w-3 h-3" />
                            Verifica ISO
                        </a>
                    )}
                    <a
                        href={norm.url_fonte}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Fonte
                    </a>
                </div>
            </div>
        </div>
    );
}

// ─── Riga HS ──────────────────────────────────────────────────────────────────

function HsRow({ hs }: { hs: CodiceHSRef }) {
    const giorni = giorniDaUltimaVerifica(hs);

    return (
        <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/40">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-mono font-semibold text-white">{hs.codice}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-600/40 text-slate-300 border border-slate-600/50">HS/TARIC</span>
                    </div>
                    <p className="text-xs text-slate-400">{hs.descrizione}</p>
                    {hs.note && <p className="text-xs text-slate-500 mt-0.5 italic">{hs.note}</p>}
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        Verificato {giorni}gg fa
                        {" · "}
                        <User className="w-3 h-3" />
                        {hs.verificato_da.replace("human:", "")}
                    </div>
                </div>
                <a
                    href={hs.url_taric}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition shrink-0"
                >
                    <ExternalLink className="w-3 h-3" />
                    Consulta TARIC
                </a>
            </div>
        </div>
    );
}

// ─── Sezione ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

// ─── Pagina principale ────────────────────────────────────────────────────────

export default function NormativePage() {
    const [checking, setChecking] = useState(false);
    const [eurlexResults, setEurlexResults] = useState<Record<string, EurLexCheckResult>>({});
    const [lastCheck, setLastCheck] = useState<string | null>(null);

    const eurlexNorms = Object.values(NORMATIVE).filter(n => n.verifica_metodo === "eurlex_sparql");
    const isoNorms    = Object.values(NORMATIVE).filter(n => n.verifica_metodo === "human");
    const hsEntries   = Object.values(HS_CODICI);

    async function verificaTutto() {
        setChecking(true);
        try {
            const res  = await fetch("/api/v1/normative/check-eurlex");
            const data = await res.json();
            const map: Record<string, EurLexCheckResult> = {};
            for (const r of data.risultati ?? []) {
                map[r.celex] = r;
            }
            setEurlexResults(map);
            setLastCheck(new Date().toLocaleTimeString("it-IT"));
        } catch {
            // silent — individual rows will show their own errors
        } finally {
            setChecking(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/impostazioni" className="text-slate-400 hover:text-white transition">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookMarked className="w-5 h-5 text-amber-400" />
                        Registro Normativo
                    </h1>
                    <p className="text-slate-400 text-xs mt-0.5">
                        Fonte di verità per tutti i riferimenti normativi usati da prompt AI, cross-check e messaggi di sistema
                    </p>
                </div>
                <button
                    onClick={verificaTutto}
                    disabled={checking}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-medium transition"
                >
                    {checking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Verifica EUR-Lex
                </button>
            </div>

            {/* Last check timestamp */}
            {lastCheck && (
                <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verifica EUR-Lex completata alle {lastCheck}
                </div>
            )}

            {/* Info banner */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/80 space-y-1">
                <p className="font-medium text-amber-300">Come funziona il registro</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-200/70">
                    <li><strong className="text-amber-200">EUR-Lex SPARQL</strong> — verifica automatica dello stato delle direttive/regolamenti UE (gratuita, ufficiale UE)</li>
                    <li><strong className="text-amber-200">Verifica umana</strong> — per norme ISO/EN: clicca il link "Verifica ISO" per controllare manualmente sul sito ufficiale, poi aggiorna il file <code className="font-mono">src/lib/normative-config.ts</code></li>
                    <li><strong className="text-amber-200">TARIC</strong> — nessuna API gratuita disponibile; usa il link di consultazione diretta per ogni codice HS</li>
                </ul>
            </div>

            {/* Direttive e Regolamenti UE */}
            <Section title="Direttive e Regolamenti UE">
                {eurlexNorms.map(norm => (
                    <NormRow
                        key={norm.id}
                        norm={norm}
                        eurlex={norm.celex ? eurlexResults[norm.celex] : undefined}
                    />
                ))}
            </Section>

            {/* Norme tecniche ISO/EN */}
            <Section title="Norme Tecniche ISO / EN">
                <div className="rounded-lg border border-slate-600/30 bg-slate-800/20 p-3 text-xs text-slate-400">
                    Queste norme richiedono verifica manuale. ISO e CEN non espongono API pubbliche gratuite.
                    Verificare il sito ufficiale e aggiornare <code className="font-mono text-slate-300">verificato_il</code> in{" "}
                    <code className="font-mono text-slate-300">src/lib/normative-config.ts</code>.
                </div>
                {isoNorms.map(norm => (
                    <NormRow key={norm.id} norm={norm} />
                ))}
            </Section>

            {/* Codici HS / TARIC */}
            <Section title="Codici HS / TARIC">
                <div className="rounded-lg border border-slate-600/30 bg-slate-800/20 p-3 text-xs text-slate-400">
                    I codici HS devono essere verificati periodicamente su TARIC (aliquote e misure commerciali possono variare).
                    Nessuna API REST gratuita — usa i link di consultazione diretta.
                </div>
                {hsEntries.map(hs => (
                    <HsRow key={hs.codice} hs={hs} />
                ))}
            </Section>

        </div>
    );
}
