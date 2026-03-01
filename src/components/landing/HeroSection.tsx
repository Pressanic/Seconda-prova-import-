import Link from "next/link";
import { ArrowRight, Shield, Play, BarChart2, FileText, Zap, CheckCircle, ChevronDown } from "lucide-react";

function HeroIllustration() {
    return (
        <div className="relative w-full max-w-[400px] mx-auto lg:mx-0 lg:ml-auto">
            {/* Ambient glow */}
            <div className="absolute -inset-6 bg-gradient-to-br from-blue-600/12 to-indigo-600/8 rounded-3xl blur-3xl pointer-events-none" />

            {/* Card */}
            <div className="relative bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 shadow-2xl shadow-black/40 backdrop-blur-sm">

                {/* Status bar */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-slate-400 font-medium">Live verification</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">IMP-2024-089</span>
                </div>

                {/* Input nodes */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="flex flex-col items-center gap-2 bg-slate-900/70 border border-blue-500/20 rounded-xl p-3">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <span className="text-[10px] text-slate-400 font-medium text-center leading-tight">CE Docs</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-slate-900/70 border border-indigo-500/20 rounded-xl p-3">
                        <BarChart2 className="w-5 h-5 text-indigo-400" />
                        <span className="text-[10px] text-slate-400 font-medium text-center leading-tight">HS Code</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-slate-900/70 border border-violet-500/20 rounded-xl p-3">
                        <FileText className="w-5 h-5 text-violet-400" />
                        <span className="text-[10px] text-slate-400 font-medium text-center leading-tight">Regulations</span>
                    </div>
                </div>

                {/* Arrow down */}
                <div className="flex justify-center my-1">
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                </div>

                {/* AI processing node */}
                <div className="flex items-center gap-3 bg-blue-600/10 border border-blue-500/25 rounded-xl p-3.5 mb-1">
                    <div className="w-9 h-9 bg-blue-600/25 border border-blue-500/40 rounded-xl flex items-center justify-center shrink-0">
                        <Zap className="w-[18px] h-[18px] text-blue-400" />
                    </div>
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
                </div>

                {/* Arrow down */}
                <div className="flex justify-center my-1">
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                </div>

                {/* Output node */}
                <div className="flex items-center gap-3 bg-green-600/10 border border-green-500/25 rounded-xl p-3.5">
                    <div className="w-9 h-9 bg-green-600/20 border border-green-500/30 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">Cleared for import</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Risk Score 18/100 · 0 blockers</div>
                    </div>
                    <div className="bg-green-500/15 border border-green-500/25 text-green-400 text-xs font-bold px-2.5 py-1 rounded-lg shrink-0">
                        ✓
                    </div>
                </div>

                {/* Stats footer */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700/50">
                    {[
                        { label: "CE Documents", value: "6/6" },
                        { label: "HS Verified", value: "8477.10" },
                        { label: "Anomalies", value: "0" },
                    ].map(({ label, value }) => (
                        <div key={label} className="text-center">
                            <div className="text-sm font-bold text-green-400">{value}</div>
                            <div className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-wide">{label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden px-4 pt-20 pb-20">

            {/* Background blobs — toned down */}
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

            <div className="relative max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

                    {/* ── Left: text ── */}
                    <div className="max-w-xl">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-3.5 py-1.5 mb-7">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <span className="text-slate-400 text-xs font-medium">CE · HS/TARIC · Risk Score</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl xl:text-[3.6rem] font-bold text-white leading-[1.08] tracking-tight mb-5">
                            Secure your machinery imports into the{" "}
                            <span className="text-blue-400">European Union.</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-slate-400 text-lg sm:text-xl leading-relaxed mb-9">
                            We verify CE documentation, HS classification and regulatory coherence
                            so your shipment doesn&apos;t get blocked.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
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
                        </div>

                        {/* Trust micro-proof */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
                            <span>No credit card required</span>
                            <span className="text-slate-700">·</span>
                            <span>GDPR compliant</span>
                            <span className="text-slate-700">·</span>
                            <span>Data stored in EU</span>
                        </div>
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
