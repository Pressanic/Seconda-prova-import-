"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CreditCard, CheckCircle, Zap, Building2, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Suspense } from "react";

const PLANS = {
    free: {
        name: "Free",
        price: "€0",
        features: ["2 pratiche attive", "1 utente", "Analisi AI base"],
    },
    professional: {
        name: "Professional",
        price: "€79/mese",
        priceAnnual: "€66/mese (annuale)",
        features: ["Pratiche illimitate", "5 utenti", "Analisi AI avanzata", "Cross-check automatico", "Export report"],
    },
};

function BillingContent() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const success = searchParams.get("success") === "1";
    const [loadingCheckout, setLoadingCheckout] = useState<"monthly" | "annual" | null>(null);
    const [loadingPortal, setLoadingPortal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const orgId = (session?.user as any)?.organization_id;
    const piano = (session?.user as any)?.piano ?? "free";

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
        );
    }

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
        <div className="max-w-2xl space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-white">Abbonamento</h2>
                <p className="text-sm text-slate-400 mt-0.5">Gestisci il piano della tua organizzazione</p>
            </div>

            {success && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-3 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Abbonamento attivato con successo. Benvenuto in Professional!
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {!orgId ? (
                <div className="glass-card p-6 flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-white">Organizzazione non configurata</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Il tuo account non è ancora associato a un'organizzazione.
                            Contatta l'amministratore per completare la configurazione prima di gestire l'abbonamento.
                        </p>
                    </div>
                </div>
            ) : piano === "professional" ? (
                /* Piano attivo */
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Professional</p>
                                <p className="text-xs text-slate-400">Piano attivo</p>
                            </div>
                        </div>
                        <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full font-medium">
                            Attivo
                        </span>
                    </div>

                    <ul className="space-y-1.5">
                        {PLANS.professional.features.map(f => (
                            <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                                <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    <div className="pt-3 border-t border-slate-700/50">
                        <button
                            onClick={handlePortal}
                            disabled={loadingPortal}
                            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition disabled:opacity-50"
                        >
                            {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                            Gestisci abbonamento e fatture
                        </button>
                    </div>
                </div>
            ) : (
                /* Piano free — upgrade */
                <div className="space-y-4">
                    {/* Piano corrente */}
                    <div className="glass-card p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-white">Piano attuale: Free</p>
                            <p className="text-xs text-slate-400 mt-0.5">2 pratiche attive · 1 utente</p>
                        </div>
                        <span className="text-xs bg-slate-700/60 text-slate-400 border border-slate-600/50 px-2.5 py-1 rounded-full">
                            Free
                        </span>
                    </div>

                    {/* Upgrade card */}
                    <div className="glass-card p-6 border border-blue-500/20 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Passa a Professional</p>
                                <p className="text-xs text-slate-400">Sblocca tutte le funzionalità</p>
                            </div>
                        </div>

                        <ul className="space-y-1.5">
                            {PLANS.professional.features.map(f => (
                                <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                onClick={() => handleUpgrade("monthly")}
                                disabled={!!loadingCheckout}
                                className="flex flex-col items-center gap-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl px-4 py-3 transition shadow-lg shadow-blue-600/20"
                            >
                                {loadingCheckout === "monthly" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <span className="text-sm font-semibold">€79 / mese</span>
                                        <span className="text-xs opacity-75">Mensile</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handleUpgrade("annual")}
                                disabled={!!loadingCheckout}
                                className="flex flex-col items-center gap-1 bg-slate-700/60 hover:bg-slate-700 disabled:opacity-50 text-white border border-slate-600/50 rounded-xl px-4 py-3 transition"
                            >
                                {loadingCheckout === "annual" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <span className="text-sm font-semibold">€66 / mese</span>
                                        <span className="text-xs text-slate-400">Annuale — risparmia 16%</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>}>
            <BillingContent />
        </Suspense>
    );
}
