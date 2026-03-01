"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Play, BarChart2, FileText, Zap, CheckCircle, ChevronDown } from "lucide-react";

// ─── Illustration ─────────────────────────────────────────────────────────────

// Spring config helpers
const pop    = { type: "spring" as const, stiffness: 280, damping: 18 };
const settle = { type: "spring" as const, stiffness: 180, damping: 16 };

function HeroIllustration() {
    return (
        /* Wrapper — zoom in from slightly smaller */
        <motion.div
            className="relative w-full max-w-[460px] mx-auto lg:mx-0 lg:ml-auto"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Ambient glow — slow breathe loop */}
            <motion.div
                className="absolute -inset-8 bg-gradient-to-br from-blue-600/14 to-indigo-600/10 rounded-3xl blur-3xl pointer-events-none"
                style={{ willChange: "opacity, transform" }}
                animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.04, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Card */}
            <div className="relative bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 shadow-2xl shadow-black/50 backdrop-blur-sm">

                {/* ── 1. Status bar ── */}
                <motion.div
                    className="flex items-center justify-between mb-5"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.5 }}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-slate-400 font-medium">Live verification</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">IMP-2024-089</span>
                </motion.div>

                {/* ── 2. Input nodes — pop in one by one ── */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {([
                        { Icon: Shield,    label: "CE Docs",     border: "border-blue-500/25",   bg: "bg-blue-500/8",   text: "text-blue-400"   },
                        { Icon: BarChart2, label: "HS Code",     border: "border-indigo-500/25", bg: "bg-indigo-500/8", text: "text-indigo-400" },
                        { Icon: FileText,  label: "Regulations", border: "border-violet-500/25", bg: "bg-violet-500/8", text: "text-violet-400" },
                    ] as const).map(({ Icon, label, border, bg, text }, i) => (
                        <motion.div
                            key={label}
                            className={`flex flex-col items-center gap-2 bg-slate-900/70 ${border} border rounded-xl p-3`}
                            initial={{ opacity: 0, scale: 0.55, y: 6 }}
                            animate={{ opacity: 1, scale: 1,    y: 0 }}
                            transition={{ ...pop, delay: 0.72 + i * 0.22 }}
                        >
                            <motion.div
                                className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ ...pop, delay: 0.78 + i * 0.22 }}
                            >
                                <Icon className={`w-4 h-4 ${text}`} />
                            </motion.div>
                            <span className="text-[10px] text-slate-400 font-medium text-center leading-tight">{label}</span>
                        </motion.div>
                    ))}
                </div>

                {/* ── 3. Connector arrow ── */}
                <motion.div
                    className="flex justify-center my-1"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.3, delay: 1.4, ease: "easeOut" }}
                    style={{ originY: 0 }}
                >
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                </motion.div>

                {/* ── 4. AI processing node — centrepiece ── */}
                <motion.div
                    className="relative flex items-center gap-3 bg-blue-600/10 border border-blue-500/25 rounded-xl p-3.5 mb-1 overflow-hidden"
                    initial={{ opacity: 0, scale: 0.82, y: 14 }}
                    animate={{ opacity: 1, scale: 1,    y: 0  }}
                    transition={{ ...settle, delay: 1.55 }}
                >
                    {/* Subtle scan line that loops after entrance */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/6 to-transparent"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{ duration: 1.6, delay: 2.1, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                    />

                    <motion.div
                        className="w-9 h-9 bg-blue-600/25 border border-blue-500/40 rounded-xl flex items-center justify-center shrink-0"
                        animate={{ boxShadow: ["0 0 0px rgba(96,165,250,0)", "0 0 14px rgba(96,165,250,0.35)", "0 0 0px rgba(96,165,250,0)"] }}
                        transition={{ duration: 2.5, delay: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Zap className="w-[18px] h-[18px] text-blue-400" />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">AI Analysis</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Cross-checking compliance...</div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 150}ms` }}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* ── 5. Connector arrow ── */}
                <motion.div
                    className="flex justify-center my-1"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.3, delay: 1.95, ease: "easeOut" }}
                    style={{ originY: 0 }}
                >
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                </motion.div>

                {/* ── 6. Output node — climax, springs in with slight overshoot ── */}
                <motion.div
                    className="flex items-center gap-3 bg-green-600/10 border border-green-500/25 rounded-xl p-3.5"
                    initial={{ opacity: 0, scale: 0.78, y: 16 }}
                    animate={{ opacity: 1, scale: 1,    y: 0  }}
                    transition={{ ...settle, delay: 2.1 }}
                >
                    <motion.div
                        className="w-9 h-9 bg-green-600/20 border border-green-500/30 rounded-xl flex items-center justify-center shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ ...pop, delay: 2.2 }}
                    >
                        <CheckCircle className="w-5 h-5 text-green-400" />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">Cleared for import</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Risk Score 18/100 · 0 blockers</div>
                    </div>

                    {/* Checkmark badge — final pop */}
                    <motion.div
                        className="bg-green-500/15 border border-green-500/25 text-green-400 text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...pop, delay: 2.4 }}
                    >
                        ✓
                    </motion.div>
                </motion.div>

                {/* ── 7. Stats footer — denouement ── */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700/50">
                    {([
                        { label: "CE Documents", value: "6/6"     },
                        { label: "HS Verified",  value: "8477.10" },
                        { label: "Anomalies",    value: "0"       },
                    ] as const).map(({ label, value }, i) => (
                        <motion.div
                            key={label}
                            className="text-center"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 2.55 + i * 0.15, ease: "easeOut" }}
                        >
                            <div className="text-sm font-bold text-green-400">{value}</div>
                            <div className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-wide">{label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden px-4 pt-28 pb-20">

            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-8%] w-[560px] h-[560px] bg-blue-600/6 rounded-full blur-[130px]" />
                <div className="absolute bottom-[-8%] right-[-5%] w-[420px] h-[420px] bg-indigo-600/6 rounded-full blur-[110px]" />
            </div>

            {/* Grid pattern */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(51,65,85,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,0.12) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                }}
            />

            {/* Bottom fade — smooth transition into next section */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-b from-transparent via-[#0f172a]/30 to-[#0f172a] pointer-events-none" />

            <div className="relative max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

                    {/* ── Left: text ── */}
                    <div className="max-w-xl">

                        {/* Badge */}
                        <motion.div
                            className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-3.5 py-1.5 mb-7"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                        >
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <span className="text-slate-400 text-xs font-medium">CE · HS/TARIC · Risk Score</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            className="text-4xl sm:text-5xl xl:text-[3.6rem] font-bold text-white leading-[1.08] tracking-tight mb-5"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
                        >
                            Secure your machinery imports into the{" "}
                            <span className="text-blue-400">European Union.</span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            className="text-slate-400 text-lg sm:text-xl leading-relaxed mb-9"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.28, ease: "easeOut" }}
                        >
                            We verify CE documentation, HS classification and regulatory coherence
                            so your shipment doesn&apos;t get blocked.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            className="flex flex-col sm:flex-row items-start gap-3 mb-8"
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                        >
                            <Link
                                href="/login"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-blue-600/25 text-sm w-full sm:w-auto justify-center sm:justify-start"
                            >
                                Start for free <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="#features"
                                className="flex items-center gap-2 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 bg-slate-800/40 hover:bg-slate-800/70 px-6 py-3 rounded-xl transition text-sm w-full sm:w-auto justify-center sm:justify-start"
                            >
                                <Play className="w-3.5 h-3.5 text-blue-400" />
                                See how it works
                            </a>
                        </motion.div>

                        {/* Trust micro-proof */}
                        <motion.div
                            className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.55 }}
                        >
                            <span>No credit card required</span>
                            <span className="text-slate-700">·</span>
                            <span>GDPR compliant</span>
                            <span className="text-slate-700">·</span>
                            <span>Data stored in EU</span>
                        </motion.div>
                    </div>

                    {/* ── Right: illustration ── */}
                    <div className="flex justify-center lg:justify-end">
                        <HeroIllustration />
                    </div>
                </div>
            </div>
        </section>
    );
}
