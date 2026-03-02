"use client";

import { motion } from "framer-motion";
import { FolderOpen, AlertTriangle, Calendar, FileWarning } from "lucide-react";

const ICONS = {
    FolderOpen,
    AlertTriangle,
    Calendar,
    FileWarning,
} as const;

export interface KpiItem {
    label: string;
    value: string | number;
    icon: keyof typeof ICONS;
    color: string;
    bg: string;
    border: string;
    accent: string; // strip top color
}

export default function KpiCards({ kpis }: { kpis: KpiItem[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => {
                const Icon = ICONS[kpi.icon];
                return (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="relative glass-card overflow-hidden"
                    >
                        {/* Colored accent strip at top */}
                        <div className={`absolute top-0 left-0 right-0 h-[2px] ${kpi.accent}`} />

                        <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">{kpi.label}</p>
                                    <p className={`text-[2.25rem] font-bold mt-1 leading-none tabular-nums ${kpi.color}`}>
                                        {kpi.value}
                                    </p>
                                </div>
                                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/5`}>
                                    <Icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
