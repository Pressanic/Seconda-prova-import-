"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Zap } from "lucide-react";

type BillingCycle = "monthly" | "annual";

const PLANS = [
    {
        name: "Free",
        monthlyPrice: "€0",
        annualPrice: "€0",
        annualNote: null,
        period: "/ month",
        desc: "Discover the platform",
        highlight: false,
        badge: null,
        cta: "Start for free",
        ctaHref: "/login",
        features: [
            { text: "2 active dossiers", ok: true },
            { text: "1 user", ok: true },
            { text: "Basic HS classification", ok: true },
            { text: "PDF report (watermarked)", ok: true },
            { text: "Risk Score Engine", ok: false },
            { text: "NANDO verification", ok: false },
            { text: "Audit Log", ok: false },
            { text: "Priority support", ok: false },
        ],
    },
    {
        name: "Professional",
        monthlyPrice: "€79",
        annualPrice: "€66",
        annualNote: "Billed €790 / year",
        period: "/ month",
        desc: "For teams that import regularly",
        highlight: true,
        badge: "Most Popular",
        cta: "Try 14 days free",
        ctaHref: "/login",
        features: [
            { text: "Unlimited dossiers", ok: true },
            { text: "Up to 5 users", ok: true },
            { text: "Advanced HS/TARIC classification", ok: true },
            { text: "PDF report without watermark", ok: true },
            { text: "Full Risk Score Engine", ok: true },
            { text: "NANDO notified body verification", ok: true },
            { text: "Full Audit Log", ok: true },
            { text: "Priority email support", ok: true },
        ],
    },
    {
        name: "Enterprise",
        monthlyPrice: "Custom",
        annualPrice: "Custom",
        annualNote: null,
        period: "",
        desc: "For large organizations and firms",
        highlight: false,
        badge: null,
        cta: "Contact us",
        ctaHref: "mailto:info@importcompliance.it",
        features: [
            { text: "Everything in Professional", ok: true },
            { text: "Unlimited users", ok: true },
            { text: "SSO / SAML", ok: true },
            { text: "API access", ok: true },
            { text: "99.9% SLA guaranteed", ok: true },
            { text: "Dedicated onboarding", ok: true },
            { text: "Custom billing", ok: true },
            { text: "Dedicated account manager", ok: true },
        ],
    },
] as const;

const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
    }),
};

export default function PricingSection() {
    const [billing, setBilling] = useState<BillingCycle>("monthly");

    return (
        <section id="pricing" className="py-28 px-4 relative overflow-hidden">

            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative max-w-6xl mx-auto">

                {/* Header */}
                <motion.div
                    className="text-center mb-14"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-3.5 py-1.5 mb-6">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <span className="text-slate-400 text-xs font-medium">Pricing</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Simple pricing, no surprises
                    </h2>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
                        Start free, scale when you&apos;re ready. No credit card required.
                    </p>

                    {/* Billing toggle */}
                    <div className="inline-flex items-center gap-4">
                        <span className={`text-sm font-medium transition-colors ${billing === "monthly" ? "text-white" : "text-slate-500"}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setBilling(b => b === "monthly" ? "annual" : "monthly")}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${billing === "annual" ? "bg-blue-600" : "bg-slate-700"}`}
                            aria-label="Toggle billing cycle"
                        >
                            <motion.div
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                                animate={{ left: billing === "annual" ? "28px" : "4px" }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium transition-colors ${billing === "annual" ? "text-white" : "text-slate-500"}`}>
                                Annual
                            </span>
                            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                                SAVE 17%
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Plans grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {PLANS.map((plan, i) => {
                        const price = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
                        const isCustom = price === "Custom";

                        return (
                            <motion.div
                                key={plan.name}
                                className={`relative rounded-2xl p-7 flex flex-col ${
                                    plan.highlight
                                        ? "bg-gradient-to-b from-blue-600/10 to-slate-800/80 border-2 border-blue-500/50 shadow-xl shadow-blue-600/10"
                                        : "bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm"
                                }`}
                                custom={i}
                                variants={cardVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
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
                                    <div className="flex items-end gap-1.5 mb-1">
                                        <motion.span
                                            key={`${plan.name}-${billing}`}
                                            className="text-4xl font-bold text-white"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {isCustom ? price : price}
                                        </motion.span>
                                        {plan.period && !isCustom && (
                                            <span className="text-slate-500 text-sm mb-1">{plan.period}</span>
                                        )}
                                    </div>
                                    {billing === "annual" && plan.annualNote && (
                                        <motion.p
                                            className="text-xs text-blue-400 mb-2"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            {plan.annualNote}
                                        </motion.p>
                                    )}
                                    {billing === "monthly" && plan.name === "Professional" && (
                                        <motion.p
                                            className="text-xs text-slate-600 mb-2"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            or €66/mo billed annually
                                        </motion.p>
                                    )}
                                    <p className="text-sm text-slate-400">{plan.desc}</p>
                                </div>

                                {/* CTA */}
                                <Link
                                    href={plan.ctaHref}
                                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition mb-7 ${
                                        plan.highlight
                                            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                                            : "bg-slate-700 hover:bg-slate-600 text-white"
                                    }`}
                                >
                                    {plan.cta}
                                    {plan.highlight && <ArrowRight className="w-4 h-4" />}
                                </Link>

                                {/* Divider */}
                                <div className="border-t border-slate-700/60 mb-6" />

                                {/* Features */}
                                <ul className="space-y-3 flex-1">
                                    {plan.features.map((f) => (
                                        <li
                                            key={f.text}
                                            className={`flex items-start gap-2.5 text-sm ${f.ok ? "text-slate-300" : "text-slate-600"}`}
                                        >
                                            <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${f.ok ? "text-green-400" : "text-slate-700"}`} />
                                            {f.text}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer notes */}
                <motion.div
                    className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-10"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {[
                        "No credit card required",
                        "Cancel anytime",
                        "EU data hosting (Frankfurt)",
                        "GDPR Compliant",
                    ].map(note => (
                        <div key={note} className="flex items-center gap-2 text-sm text-slate-500">
                            <CheckCircle className="w-3.5 h-3.5 text-slate-700" />
                            {note}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
