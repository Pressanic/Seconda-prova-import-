"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Shield, Search, CheckCircle, XCircle, AlertTriangle,
    ArrowLeft, Globe, Building2, Loader2, Info
} from "lucide-react";

interface OrganismoNotificato {
    id: string;
    numero_organismo: string;
    nome_organismo: string | null;
    stato_verifica: string;
    ambito_autorizzazione: string | null;
    nando_response: any;
    verificato_at: string | null;
}

const STATO_CONFIG: Record<string, {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
}> = {
    valido: {
        label: "Valido — Autorizzato per Reg. UE 2023/1230",
        icon: CheckCircle,
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/30",
    },
    non_trovato: {
        label: "Non trovato nel registro NANDO-EU",
        icon: XCircle,
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
    },
    non_autorizzato: {
        label: "Non autorizzato per questa direttiva",
        icon: AlertTriangle,
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
    },
    non_verificato: {
        label: "Non ancora verificato",
        icon: Info,
        color: "text-slate-400",
        bg: "bg-slate-500/10",
        border: "border-slate-500/30",
    },
};

const KNOWN_NB_EXAMPLES = [
    { numero: "0062", nome: "TÜV SÜD Product Service GmbH", paese: "DE" },
    { numero: "0044", nome: "TÜV Rheinland LGA Products GmbH", paese: "DE" },
    { numero: "0068", nome: "Dekra Certification B.V.", paese: "NL" },
    { numero: "0333", nome: "IMQ - Istituto Italiano del Marchio di Qualità", paese: "IT" },
    { numero: "1023", nome: "RINA Services S.p.A.", paese: "IT" },
];

export default function OrganismoNotificatoPage() {
    const params = useParams();
    const praticaId = params.id as string;

    const [numero, setNumero] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [existing, setExisting] = useState<OrganismoNotificato | null>(null);
    const [result, setResult] = useState<{ stato_verifica: string; nando_response: any; organismo: OrganismoNotificato } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/v1/pratiche/${praticaId}/organismo-notificato`)
            .then(r => r.json())
            .then(data => {
                if (data.organismi?.[0]) setExisting(data.organismi[0]);
            })
            .finally(() => setFetching(false));
    }, [praticaId]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!numero.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/api/v1/pratiche/${praticaId}/organismo-notificato`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ numero_organismo: numero.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Errore durante la verifica");
            } else {
                setResult(data);
                setExisting(data.organismo);
            }
        } catch {
            setError("Errore di rete. Riprova.");
        } finally {
            setLoading(false);
        }
    };

    const currentStato = result?.stato_verifica ?? existing?.stato_verifica;
    const statoConfig = currentStato ? STATO_CONFIG[currentStato] : null;

    return (
        <div className="space-y-5 max-w-2xl">
            {/* Back link */}
            <div>
                <Link
                    href={`/pratiche/${praticaId}/compliance-ce`}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition mb-4"
                >
                    <ArrowLeft className="w-4 h-4" /> Torna a Compliance CE
                </Link>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Verifica Organismo Notificato
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                    Verifica la validità dell&apos;organismo notificato nel registro europeo NANDO
                    per la conformità alla Direttiva Macchine (Reg. UE 2023/1230 / Dir. 2006/42/CE).
                </p>
            </div>

            {/* Current status */}
            {!fetching && existing && !result && (
                <div className={`glass-card p-4 border ${STATO_CONFIG[existing.stato_verifica]?.border ?? "border-slate-700"}`}>
                    <div className="flex items-start gap-3">
                        {(() => {
                            const cfg = STATO_CONFIG[existing.stato_verifica];
                            if (!cfg) return null;
                            const Icon = cfg.icon;
                            return <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} />;
                        })()}
                        <div>
                            <p className="text-sm font-semibold text-white">
                                Ultimo organismo verificato: <span className="font-mono text-blue-300">#{existing.numero_organismo}</span>
                            </p>
                            {existing.nome_organismo && (
                                <p className="text-sm text-slate-300 mt-0.5">{existing.nome_organismo}</p>
                            )}
                            <p className={`text-xs mt-1 ${STATO_CONFIG[existing.stato_verifica]?.color ?? "text-slate-400"}`}>
                                {STATO_CONFIG[existing.stato_verifica]?.label}
                            </p>
                            {existing.ambito_autorizzazione && (
                                <p className="text-xs text-slate-500 mt-0.5">Ambiti: {existing.ambito_autorizzazione}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Verification form */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-400" />
                    Ricerca nel registro NANDO
                </h3>
                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5">
                            Numero Organismo Notificato <span className="text-red-400">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={numero}
                                onChange={e => setNumero(e.target.value)}
                                placeholder="es. 0062"
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                maxLength={10}
                            />
                            <button
                                type="submit"
                                disabled={loading || !numero.trim()}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Verifica
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">
                            Il numero è presente nella Dichiarazione CE di Conformità del fornitore.
                        </p>
                    </div>
                </form>

                {error && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                        {error}
                    </div>
                )}
            </div>

            {/* Verification result */}
            {result && statoConfig && (
                <div className={`glass-card p-5 border ${statoConfig.border}`}>
                    <div className="flex items-start gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statoConfig.bg}`}>
                            <statoConfig.icon className={`w-5 h-5 ${statoConfig.color}`} />
                        </div>
                        <div>
                            <p className={`text-base font-semibold ${statoConfig.color}`}>{statoConfig.label}</p>
                            {result.organismo.nome_organismo && (
                                <p className="text-sm text-white mt-0.5 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                    {result.organismo.nome_organismo}
                                </p>
                            )}
                        </div>
                    </div>

                    {result.nando_response && (
                        <div className="space-y-2 text-sm border-t border-slate-700 pt-4">
                            {result.nando_response.paese && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="text-slate-500">Paese:</span>
                                    <span>{result.nando_response.paese}</span>
                                </div>
                            )}
                            {result.nando_response.ambiti && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="text-slate-500">Ambiti autorizzati:</span>
                                    <span className="capitalize">{(result.nando_response.ambiti as string[]).join(", ")}</span>
                                </div>
                            )}
                            <p className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                                {result.nando_response.message}
                            </p>
                            <p className="text-xs text-slate-600">
                                Verifica simulata il {new Date(result.nando_response.queried_at).toLocaleString("it-IT")}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Help: known NB examples */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    Organismi notificati noti (per test)
                </h3>
                <div className="space-y-2">
                    {KNOWN_NB_EXAMPLES.map(nb => (
                        <button
                            key={nb.numero}
                            type="button"
                            onClick={() => setNumero(nb.numero)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition text-left"
                        >
                            <div>
                                <span className="font-mono text-xs text-blue-400 mr-2">#{nb.numero}</span>
                                <span className="text-sm text-white">{nb.nome}</span>
                            </div>
                            <span className="text-xs text-slate-500 ml-2">{nb.paese}</span>
                        </button>
                    ))}
                </div>
                <p className="text-xs text-slate-600 mt-3">
                    Nota: la verifica è simulata su un DB locale. In produzione verrebbe interrogato il registro NANDO ufficiale (EU).
                </p>
            </div>
        </div>
    );
}
