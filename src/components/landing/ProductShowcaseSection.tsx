"use client";

import { useRef, useState, useEffect } from "react";
import {
    motion, useScroll, useTransform, useMotionValueEvent,
} from "framer-motion";
import {
    CheckCircle, AlertTriangle, XCircle, Settings2, FileText,
    BarChart2, Download, Shield, Zap,
} from "lucide-react";

// ─── Counter animation hook ───────────────────────────────────────────────────

function useCounter(target: number, isActive: boolean, duration = 1400) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!isActive) { setVal(0); return; }
        let startTime: number | null = null;
        let frame: number;
        const tick = (ts: number) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setVal(Math.round(eased * target));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [isActive, target, duration]);
    return val;
}

// ─── Illustration: Card 01 — Form ────────────────────────────────────────────

function FormMock({ isActive }: { isActive: boolean }) {
    const fields = [
        { label: "Machine model", value: "HAITIAN MA900/260" },
        { label: "Serial number",  value: "HT-2024-09341" },
        { label: "HS Code",        value: "8477.10" },
        { label: "Weight (kg)",    value: "12.400" },
        { label: "Machine type",   value: "Injection Press" },
    ];
    return (
        <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-3xl p-7 shadow-2xl shadow-black/50">
            <motion.div
                className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/40"
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, delay: 0.05 }}
            >
                <div className="w-9 h-9 bg-blue-600/25 border border-blue-500/30 rounded-xl flex items-center justify-center">
                    <Settings2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <div className="text-sm font-semibold text-white">Machine registration</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">New import · IMP-2024-089</div>
                </div>
            </motion.div>

            <div className="space-y-2.5">
                {fields.map((f, i) => (
                    <motion.div
                        key={f.label}
                        className="flex items-center bg-slate-800/60 border border-slate-700/30 rounded-xl px-4 py-3"
                        animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
                        transition={{ duration: 0.35, delay: 0.15 + i * 0.1 }}
                    >
                        <span className="text-[11px] text-slate-500 w-28 shrink-0">{f.label}</span>
                        <span className="text-sm text-white font-medium">{f.value}</span>
                        {i === 2 && (
                            <span className="ml-auto text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-md px-1.5 py-0.5 font-semibold">verified</span>
                        )}
                    </motion.div>
                ))}
            </div>

            <motion.div
                className="flex justify-end mt-5"
                animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: 0.72 }}
            >
                <div className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer">
                    <CheckCircle className="w-4 h-4" />
                    Save machinery
                </div>
            </motion.div>
        </div>
    );
}

// ─── Illustration: Card 02 — Documents ───────────────────────────────────────

function DocumentsMock({ isActive }: { isActive: boolean }) {
    const docs = [
        { name: "CE Declaration of Conformity",        status: "ok"      as const },
        { name: "User Manual EN/IT",                   status: "ok"      as const },
        { name: "Technical File",                      status: "warning" as const, note: "Directive reference mismatch" },
        { name: "Risk Assessment ISO 12100",           status: "ok"      as const },
        { name: "Electrical diagrams CEI 60204-1",     status: "error"   as const, note: "Document missing" },
    ];
    const cfg = {
        ok:      { row: "bg-green-500/5 border-green-500/15",   icon: <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> },
        warning: { row: "bg-amber-500/8 border-amber-500/15",   icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" /> },
        error:   { row: "bg-red-500/8   border-red-500/15",     icon: <XCircle className="w-4 h-4 text-red-400 shrink-0" /> },
    };
    return (
        <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-3xl p-7 shadow-2xl shadow-black/50">
            <motion.div
                className="flex items-center justify-between mb-5 pb-4 border-b border-slate-700/40"
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, delay: 0.05 }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-600/25 border border-indigo-500/30 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-white">CE Documents</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">5 required documents</div>
                    </div>
                </div>
                <motion.span
                    className="text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg px-2.5 py-1 font-semibold"
                    animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    2 issues found
                </motion.span>
            </motion.div>

            <div className="space-y-2">
                {docs.map((doc, i) => (
                    <motion.div
                        key={doc.name}
                        className={`flex items-start gap-3 border rounded-xl px-4 py-3 ${cfg[doc.status].row}`}
                        animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
                        transition={{ duration: 0.35, delay: 0.15 + i * 0.12 }}
                    >
                        {cfg[doc.status].icon}
                        <div className="min-w-0">
                            <div className="text-sm text-slate-200 font-medium leading-tight">{doc.name}</div>
                            {"note" in doc && doc.note && (
                                <div className="text-[11px] text-slate-500 mt-0.5">{doc.note}</div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Illustration: Card 03 — Risk Score ──────────────────────────────────────

function RiskMock({ isActive }: { isActive: boolean }) {
    const score = useCounter(34, isActive);
    const actions = [
        { priority: "HIGH", text: "Fix Technical File directive reference",  color: "red"   as const },
        { priority: "MED",  text: "Upload electrical diagrams CEI 60204-1", color: "amber" as const },
        { priority: "LOW",  text: "Verify user manual page count",           color: "slate" as const },
    ];
    const badge = {
        red:   "bg-red-500/15   text-red-400   border-red-500/25",
        amber: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        slate: "bg-slate-700/80 text-slate-400 border-slate-600/40",
    };
    return (
        <div className="w-full space-y-4">
            {/* Score card */}
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl p-6 shadow-2xl shadow-black/50">
                <motion.div
                    className="flex items-center gap-2 mb-4"
                    animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <BarChart2 className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">Risk Score</span>
                </motion.div>

                <div className="flex items-end gap-4 mb-4">
                    <motion.span
                        className="text-8xl font-black text-amber-400 leading-none tabular-nums"
                        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        {score}
                    </motion.span>
                    <div className="pb-2">
                        <div className="text-sm text-amber-400/80 font-semibold">MEDIUM RISK</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">0 critical · 2 warnings · 1 missing</div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                        animate={isActive ? { width: "34%" } : { width: "0%" }}
                        transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl p-5 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">Action plan</span>
                </div>
                <div className="space-y-2">
                    {actions.map((a, i) => (
                        <motion.div
                            key={a.text}
                            className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/30 rounded-xl px-3.5 py-2.5"
                            animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                            transition={{ duration: 0.35, delay: 1.1 + i * 0.14 }}
                        >
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${badge[a.color]}`}>{a.priority}</span>
                            <span className="text-sm text-slate-300 leading-tight">{a.text}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Illustration: Card 04 — Report ──────────────────────────────────────────

function ReportMock({ isActive }: { isActive: boolean }) {
    const rows = [
        { label: "CE Documents",      value: "6 / 6"   },
        { label: "HS Classification", value: "8477.10" },
        { label: "Risk Score",        value: "18 / 100"},
        { label: "Anomalies found",   value: "0"       },
    ];
    return (
        <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-3xl p-7 shadow-2xl shadow-black/50">
            {/* Header */}
            <motion.div
                className="flex items-start justify-between mb-6 pb-5 border-b border-slate-700/40"
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, delay: 0.1 }}
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4.5 h-4.5 text-green-400 w-[18px] h-[18px]" />
                        <span className="text-base font-bold text-white">Compliance Report</span>
                    </div>
                    <div className="text-[11px] text-slate-500">March 1, 2026 · IMP-2024-089</div>
                </div>
                <motion.div
                    className="bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-xl"
                    animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                    CLEARED
                </motion.div>
            </motion.div>

            {/* Rows */}
            <div className="space-y-3 mb-6">
                {rows.map((r, i) => (
                    <motion.div
                        key={r.label}
                        className="flex justify-between items-center"
                        animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
                        transition={{ duration: 0.35, delay: 0.25 + i * 0.15 }}
                    >
                        <span className="text-sm text-slate-400">{r.label}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-200 font-semibold">{r.value}</span>
                            <motion.div
                                animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                                transition={{ delay: 0.3 + i * 0.15 + 0.1, type: "spring", stiffness: 250, damping: 15 }}
                            >
                                <CheckCircle className="w-4 h-4 text-green-400" />
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Export button */}
            <motion.div
                className="flex justify-center pt-5 border-t border-slate-700/40"
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ delay: 0.9 }}
            >
                <div className="flex items-center gap-2 border border-slate-600 hover:border-blue-500 hover:text-blue-400 text-slate-300 text-sm font-medium px-6 py-2.5 rounded-xl cursor-pointer transition-colors">
                    <Download className="w-4 h-4" />
                    Export PDF Report
                </div>
            </motion.div>
        </div>
    );
}

// ─── Steps data ───────────────────────────────────────────────────────────────

const STEPS = [
    {
        id: "01",
        label: "Step 01",
        title: "Register your machinery in minutes",
        body: "Add model, serial number and technical specs. The system automatically maps the required CE documents for your machine type and generates a compliance checklist.",
        bullets: ["Model & serial autofill", "CE document mapping", "HS Code lookup"],
        accent: "blue",
        Mock: FormMock,
    },
    {
        id: "02",
        label: "Step 02",
        title: "Upload and analyze CE documents",
        body: "Our AI reads declarations, directives, and harmonized standards. Missing or incorrect documents are flagged instantly with detailed explanations you can act on.",
        bullets: ["AI-powered extraction", "Directive verification", "Instant anomaly detection"],
        accent: "indigo",
        Mock: DocumentsMock,
    },
    {
        id: "03",
        label: "Step 03",
        title: "Get your Risk Score and action plan",
        body: "A 0–100 score tells you exactly where you stand before customs. The AI generates a prioritized list of issues with clear instructions on how to resolve each one.",
        bullets: ["0–100 risk scoring", "Prioritized action list", "Critical blockers highlighted"],
        accent: "amber",
        Mock: RiskMock,
    },
    {
        id: "04",
        label: "Step 04",
        title: "Export an audit-ready report",
        body: "Generate a professional compliance PDF in one click. Share it with your customs broker, inspector, or legal team — everything they need is in one document.",
        bullets: ["One-click PDF export", "Customs broker ready", "Full audit trail included"],
        accent: "green",
        Mock: ReportMock,
    },
] as const;

// ─── Full-screen showcase card ────────────────────────────────────────────────

function ShowcaseCard({
    step,
    isActive,
    mobile = false,
}: {
    step: typeof STEPS[number];
    isActive: boolean;
    mobile?: boolean;
}) {
    const { Mock } = step;

    if (mobile) {
        return (
            <div className="w-full py-12 px-6 border-b border-slate-800/60 last:border-0">
                <div className="mb-2">
                    <span className="text-[10px] text-blue-400 uppercase tracking-widest font-semibold">{step.label}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mt-1 leading-snug mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{step.body}</p>
                <ul className="space-y-2 mb-8">
                    {step.bullets.map(b => (
                        <li key={b} className="flex items-center gap-2 text-sm text-slate-400">
                            <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                            {b}
                        </li>
                    ))}
                </ul>
                <Mock isActive />
            </div>
        );
    }

    return (
        <div className="h-full flex items-center shrink-0" style={{ width: '100%', minWidth: '100vw' }}>
            <div className="w-full max-w-7xl mx-auto px-16 grid grid-cols-2 gap-20 items-center">

                {/* Text */}
                <motion.div
                    animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <span className="text-[11px] text-blue-400 uppercase tracking-[0.2em] font-semibold">{step.label}</span>
                    <h3 className="text-4xl xl:text-5xl font-bold text-white mt-3 leading-[1.1] tracking-tight">
                        {step.title}
                    </h3>
                    <p className="text-slate-400 text-lg leading-relaxed mt-5 max-w-lg">
                        {step.body}
                    </p>
                    <ul className="mt-7 space-y-3">
                        {step.bullets.map((b, i) => (
                            <motion.li
                                key={b}
                                className="flex items-center gap-3 text-slate-300"
                                animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
                                transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                            >
                                <div className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                                    <CheckCircle className="w-3 h-3 text-blue-400" />
                                </div>
                                <span className="text-sm font-medium">{b}</span>
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>

                {/* Illustration */}
                <motion.div
                    animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative"
                >
                    {/* Decorative step number */}
                    <div className="absolute -right-6 -bottom-6 text-[200px] font-black text-slate-800/25 leading-none select-none pointer-events-none z-0">
                        {step.id}
                    </div>
                    <div className="relative z-10">
                        <Mock isActive={isActive} />
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProductShowcaseSection() {
    const N = STEPS.length;                   // 4
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef     = useRef<HTMLDivElement>(null);
    const [translateX, setTranslateX]   = useState(0);
    const [currentStep, setCurrentStep] = useState(0);

    // Refs for debounced snap (no re-render needed)
    const lockTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollProgressRef = useRef(0);   // latest scrollYProgress value
    // Prevent snap from firing in the first 300ms after mount
    const isMountedRef      = useRef(false);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Guard: prevent the snap mechanism from firing in the first 300 ms
    // after mount (scrollYProgress briefly non-zero during initial layout).
    useEffect(() => {
        const t = setTimeout(() => { isMountedRef.current = true; }, 300);
        return () => clearTimeout(t);
    }, []);

    // Compute horizontal translation from actual DOM widths
    useEffect(() => {
        const update = () => {
            if (!trackRef.current) return;
            // Use clientWidth (excludes scrollbar) to match CSS layout
            const vw = document.documentElement.clientWidth;
            setTranslateX(-((N - 1) * vw));
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [N]);

    const x = useTransform(scrollYProgress, [0, 1], [0, translateX]);

    useMotionValueEvent(scrollYProgress, "change", (v) => {
        scrollProgressRef.current = v;

        // Update active step based on nearest card center
        const step = Math.min(N - 1, Math.round(v * (N - 1)));
        setCurrentStep(step);

        if (!isMountedRef.current) return;

        // Debounced gentle snap: after 250 ms of no scrolling, ease to the
        // nearest card center. No wheel blocking — scroll is never intercepted.
        if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        const capturedV = v;
        lockTimerRef.current = setTimeout(() => {
            lockTimerRef.current = null;
            // Abort if the user resumed scrolling during the debounce window
            if (Math.abs(scrollProgressRef.current - capturedV) > 0.005) return;
            if (!containerRef.current) return;
            const snapStep = Math.min(N - 1, Math.round(capturedV * (N - 1)));
            const centerV  = snapStep / (N - 1);
            const rect = containerRef.current.getBoundingClientRect();
            const containerTop = window.scrollY + rect.top;
            const scrollable   = containerRef.current.offsetHeight - window.innerHeight;
            window.scrollTo({ top: containerTop + centerV * scrollable, behavior: "smooth" });
        }, 250);
    });

    return (
        <>
            {/* ── DESKTOP ── */}
            <div
                ref={containerRef}
                style={{ height: `${N * 100 + 200}vh` }}   // 600 vh — extra room so card 4 snaps comfortably
                className="hidden md:block"
            >
                <div className="sticky top-0 h-screen overflow-hidden bg-[#0f172a]">

                    {/* Section header — centered, below floating navbar */}
                    <div
                        className="absolute left-0 right-0 z-20 text-center px-8 pointer-events-none"
                        style={{ top: "88px" }}
                    >
                        <div className="inline-flex items-center gap-2 bg-slate-800/70 border border-slate-700/50 rounded-full px-3.5 py-1.5 mb-3 backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <span className="text-[11px] text-blue-400 uppercase tracking-[0.15em] font-semibold">How it works</span>
                        </div>
                        <h2 className="text-2xl xl:text-3xl font-bold text-white leading-snug">
                            From machinery specs to cleared customs.
                        </h2>
                    </div>

                    {/* Horizontal track */}
                    <motion.div
                        ref={trackRef}
                        style={{ x }}
                        className="flex h-full pt-44"
                    >
                        {STEPS.map((step, i) => (
                            <ShowcaseCard
                                key={step.id}
                                step={step}
                                isActive={currentStep === i}
                            />
                        ))}
                    </motion.div>

                    {/* Progress dots */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-2 z-20 pointer-events-none">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`rounded-full transition-all duration-300 ${
                                    i === currentStep
                                        ? "w-6 h-2 bg-blue-400"
                                        : "w-2 h-2 bg-slate-700"
                                }`}
                            />
                        ))}
                    </div>

                </div>
            </div>

            {/* ── MOBILE ── */}
            <div className="md:hidden">
                <div className="text-center px-6 pt-16 pb-4">
                    <span className="text-[10px] text-blue-400 uppercase tracking-widest font-semibold">How it works</span>
                    <h2 className="text-2xl font-bold text-white mt-2 leading-tight">
                        From machinery specs to<br />cleared customs.
                    </h2>
                </div>
                {STEPS.map(step => (
                    <ShowcaseCard key={step.id} step={step} isActive mobile />
                ))}
            </div>
        </>
    );
}
