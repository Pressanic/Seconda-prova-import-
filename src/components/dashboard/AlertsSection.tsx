"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, BookMarked, AlertCircle } from "lucide-react";
import Link from "next/link";

const ICONS = {
    AlertTriangle,
    BookMarked,
    AlertCircle,
} as const;

export interface AlertItem {
    icon: keyof typeof ICONS;
    color: string;
    title: string;
    description: string;
    href: string;
    cta: string;
}

export default function AlertsSection({ alerts }: { alerts: AlertItem[] }) {
    const [open, setOpen] = useState(true);

    if (alerts.length === 0) return null;

    return (
        <div className="glass-card border border-slate-700/50 overflow-hidden">
            {/* Header collassabile */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-sm hover:bg-slate-800/30 transition"
            >
                <span className="flex items-center gap-2 font-medium text-slate-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Avvisi
                    <span className="bg-amber-500/15 text-amber-400 text-xs font-bold px-1.5 py-0.5 rounded-md">
                        {alerts.length}
                    </span>
                </span>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                </motion.div>
            </button>

            {/* Lista alert */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            height: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
                            opacity: { duration: 0.15 },
                        }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-slate-700/50 divide-y divide-slate-700/30">
                            {alerts.map((a, i) => {
                                const Icon = ICONS[a.icon];
                                return (
                                    <div key={i} className="flex items-center justify-between px-5 py-3 gap-4">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${a.color}`} />
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium ${a.color}`}>{a.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                                            </div>
                                        </div>
                                        <Link
                                            href={a.href}
                                            className={`text-xs font-medium ${a.color} hover:opacity-75 transition shrink-0`}
                                        >
                                            {a.cta} →
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
