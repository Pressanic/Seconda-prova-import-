"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CreditCard, CheckCircle, Zap, Building2, AlertCircle, X } from "lucide-react";
import { Suspense } from "react";

const FEATURES_FREE = [
    "2 pratiche attive",
    "1 utente",
    "Analisi AI base",
];

const FEATURES_PRO = [
    "Pratiche illimitate",
    "5 utenti",
    "Analisi AI avanzata",
    "Cross-check automatico",
    "Export report PDF",
];

function BillingInner({ orgId, piano }: { orgId: string | null; piano: string }) {
    const searchParams = useSearchParams();
    const success = searchParams.get("success") === "1";
    const [loadingCheckout, setLoadingCheckout] = useState<"monthly" | "annual" | null>(null);
    const [loadingPortal, setLoadingPortal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPro = piano === "professional";

    const handleUpgrade = async (interval: "monthly" | "annual") => {
        setError(null);
        setLoadingCheckout(interval);
        try {
            const res = await fetch("/api/v1/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interval }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Errore durante il checkout");
                return;
            }
            window.location.href = data.url;
        } catch {
            setError("Errore di rete. Riprova.");
        } finally {
            setLoadingCheckout(null);
        }
    };

    const handlePortal = async () => {
        setError(null);
        setLoadingPortal(true);
        try {
            const res = await fetch("/api/v1/stripe/portal", { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Errore apertura portale");
                return;
            }
            window.location.href = data.url;
        } catch {
            setError("Errore di rete. Riprova.");
        } finally {
            setLoadingPortal(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-6">
            {success && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-3 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Abbonamento attivato con successo. Benvenuto in Professional!
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)}><X className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {!orgId ? (
                <div className="glass-card p-6 flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-white">Organizzazione non configurata</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Il tuo account non è ancora associato a un&apos;organizzazione.
                            Contatta l&apos;amministratore per completare la configurazione.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className={`glass-card p-4 flex items-center justify-between ${isPro ? "border border-blue-500/20" : ""}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPro ? "bg-blue-600/20" : "bg-slate-700/60"}`}>
                                <Zap className={`w-4 h-4 ${isPro ? "text-blue-400" : "text-slate-400"}`} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">
                                    Piano {isPro ? "Professional" : "Free"} attivo
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {isPro ? "Hai accesso a tutte le funzionalità" : "Passa a Professional per sbloccare tutto"}
                                </p>
                            </div>
                        </div>
                        {isPro ? (
                            <button
                                onClick={handlePortal}
                                disabled={loadingPortal}
                                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white border border-slate-600/50 hover:border-slate-500 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
                            >
                                {loadingPortal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                                Gestisci e fatture
                            </button>
                        ) : (
                            <span className="text-xs bg-slate-700/60 text-slate-400 border border-slate-600/50 px-2.5 py-1 rounded-full">
                                Free
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Free */}
                        <div className={`glass-card p-5 space-y-4 ${!isPro ? "ring-1 ring-slate-500/40" : ""}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">Free</p>
                                    <p className="text-xl font-bold text-white mt-1">€0</p>
                                    <p className="text-xs text-slate-500">per sempre</p>
                                </div>
                                {!isPro && (
                                    <span className="text-[10px] bg-slate-600/60 text-slate-300 border border-slate-500/40 px-2 py-0.5 rounded-full">
                                        Attivo
                                    </span>
                                )}
                            </div>
                            <ul className="space-y-2">
                                {FEATURES_FREE.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                                        <CheckCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                                {FEATURES_PRO.slice(FEATURES_FREE.length).map(f => (
                                    <li key={f} className="flex items-center gap-2 text-xs text-slate-600 line-through">
                                        <X className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Professional */}
                        <div className={`glass-card p-5 space-y-4 border ${isPro ? "border-green-500/20" : "border-blue-500/20"}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">Professional</p>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <p className="text-xl font-bold text-white">€79</p>
                                        <p className="text-xs text-slate-400">/ mese</p>
                                    </div>
                                    <p className="text-xs text-slate-500">o €66/mese annuale</p>
                                </div>
                                {isPro && (
                                    <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                                        Attivo
                                    </span>
                                )}
                            </div>
                            <ul className="space-y-2">
                                {FEATURES_PRO.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                                        <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${isPro ? "text-green-400" : "text-blue-400"}`} />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {!isPro && (
                                <div className="pt-1 space-y-2">
                                    <button
                                        onClick={() => handleUpgrade("monthly")}
                                        disabled={!!loadingCheckout}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2.5 transition shadow-lg shadow-blue-600/20"
                                    >
                                        {loadingCheckout === "monthly" ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <><Zap className="w-3.5 h-3.5" /> Upgrade mensile — €79/mese</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleUpgrade("annual")}
                                        disabled={!!loadingCheckout}
                                        className="w-full flex items-center justify-center gap-2 bg-slate-700/60 hover:bg-slate-700 disabled:opacity-50 text-white text-sm rounded-xl py-2 border border-slate-600/50 transition"
                                    >
                                        {loadingCheckout === "annual" ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>Annuale — €66/mese <span className="text-xs text-green-400 font-medium">-16%</span></>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-card p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-white">Enterprise</p>
                            <p className="text-xs text-slate-400 mt-0.5">Utenti illimitati, SLA dedicato, onboarding personalizzato, fatturazione custom</p>
                        </div>
                        <a
                            href="mailto:info@importcompliance.it"
                            className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 rounded-lg px-3 py-1.5 transition shrink-0 ml-4"
                        >
                            Contattaci
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}

export function BillingContent({ orgId, piano }: { orgId: string | null; piano: string }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-blue-400 animate-spin" /></div>}>
            <BillingInner orgId={orgId} piano={piano} />
        </Suspense>
    );
}
