import Link from "next/link";
import { CheckCircle, ArrowRight, Zap } from "lucide-react";

const PLANS = [
    {
        name: "Free",
        price: "€0",
        period: "/ mese",
        desc: "Per scoprire la piattaforma",
        highlight: false,
        badge: null,
        cta: "Inizia Gratis",
        ctaHref: "/login",
        ctaStyle: "bg-slate-700 hover:bg-slate-600 text-white",
        features: [
            { text: "2 pratiche attive", ok: true },
            { text: "1 utente", ok: true },
            { text: "Classificazione HS base", ok: true },
            { text: "Report PDF (con watermark)", ok: true },
            { text: "Risk Score Engine", ok: false },
            { text: "Verifica NANDO", ok: false },
            { text: "Audit Log", ok: false },
            { text: "Supporto prioritario", ok: false },
        ],
    },
    {
        name: "Professional",
        price: "€79",
        period: "/ mese",
        desc: "Per team che importano regolarmente",
        highlight: true,
        badge: "Più Popolare",
        cta: "Prova 14 Giorni Gratis",
        ctaHref: "/login",
        ctaStyle: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25",
        annual: "€790/anno · risparmia 2 mesi",
        features: [
            { text: "Pratiche illimitate", ok: true },
            { text: "Fino a 5 utenti", ok: true },
            { text: "Classificazione HS/TARIC avanzata", ok: true },
            { text: "Report PDF senza watermark", ok: true },
            { text: "Risk Score Engine completo", ok: true },
            { text: "Verifica NANDO organismi notificati", ok: true },
            { text: "Audit Log completo", ok: true },
            { text: "Supporto email prioritario", ok: true },
        ],
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        desc: "Per grandi organizzazioni e studi",
        highlight: false,
        badge: null,
        cta: "Contattaci",
        ctaHref: "mailto:info@importcompliance.it",
        ctaStyle: "bg-slate-700 hover:bg-slate-600 text-white",
        features: [
            { text: "Tutto il piano Professional", ok: true },
            { text: "Utenti illimitati", ok: true },
            { text: "SSO / SAML", ok: true },
            { text: "API access", ok: true },
            { text: "SLA 99.9% garantito", ok: true },
            { text: "Onboarding dedicato", ok: true },
            { text: "Fatturazione personalizzata", ok: true },
            { text: "Account manager dedicato", ok: true },
        ],
    },
];

export default function PricingSection() {
    return (
        <section id="pricing" className="py-24 px-4 relative overflow-hidden">

            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative max-w-6xl mx-auto">

                {/* Header */}
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 mb-5">
                        <span className="text-slate-400 text-xs font-medium tracking-wide">Prezzi</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Piani chiari, nessuna sorpresa
                    </h2>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">
                        Inizia gratis, scala quando sei pronto. Nessuna carta di credito richiesta.
                    </p>
                </div>

                {/* Plans grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl p-7 flex flex-col ${
                                plan.highlight
                                    ? "bg-gradient-to-b from-blue-600/10 to-slate-800/80 border-2 border-blue-500/50 shadow-xl shadow-blue-600/10"
                                    : "glass-card"
                            }`}
                        >
                            {/* Popular badge */}
                            {plan.badge && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-600/30">
                                        <Zap className="w-3 h-3" /> {plan.badge}
                                    </span>
                                </div>
                            )}

                            {/* Plan name & desc */}
                            <div className="mb-6">
                                <p className="text-sm font-semibold text-slate-400 mb-1">{plan.name}</p>
                                <div className="flex items-end gap-1 mb-2">
                                    <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-white"}`}>
                                        {plan.price}
                                    </span>
                                    {plan.period && <span className="text-slate-500 text-sm mb-1">{plan.period}</span>}
                                </div>
                                {plan.annual && (
                                    <p className="text-xs text-blue-400 mb-2">{plan.annual}</p>
                                )}
                                <p className="text-sm text-slate-400">{plan.desc}</p>
                            </div>

                            {/* CTA */}
                            <Link
                                href={plan.ctaHref}
                                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition mb-7 ${plan.ctaStyle}`}
                            >
                                {plan.cta}
                                {plan.highlight && <ArrowRight className="w-4 h-4" />}
                            </Link>

                            {/* Divider */}
                            <div className="border-t border-slate-700/60 mb-6" />

                            {/* Features */}
                            <ul className="space-y-3 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f.text} className={`flex items-start gap-2.5 text-sm ${f.ok ? "text-slate-300" : "text-slate-600"}`}>
                                        <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${f.ok ? "text-green-400" : "text-slate-700"}`} />
                                        {f.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Footer note */}
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-10">
                    {[
                        "Nessuna carta di credito richiesta",
                        "Cancella in qualsiasi momento",
                        "Dati ospitati in EU (Frankfurt)",
                        "GDPR Compliant",
                    ].map(note => (
                        <div key={note} className="flex items-center gap-2 text-sm text-slate-500">
                            <CheckCircle className="w-3.5 h-3.5 text-slate-600" />
                            {note}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
