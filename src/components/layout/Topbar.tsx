"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { useState, Fragment } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface TopbarProps {
    user: { name?: string | null; email?: string | null; ruolo?: string };
}

const SEGMENT_LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    pratiche: "Pratiche",
    nuova: "Nuova Pratica",
    impostazioni: "Impostazioni",
    profilo: "Profilo",
    organizzazione: "Organizzazione",
    utenti: "Utenti",
    normative: "Normative",
    "audit-log": "Audit Log",
    macchinario: "Macchinario",
    "compliance-ce": "Compliance CE",
    "classificazione-hs": "Classificazione HS",
    "documenti-doganali": "Documenti Doganali",
    "risk-score": "Risk Score",
    report: "Report PDF",
    organismo: "Organismo Notificato",
};

// UUID v4 pattern
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string) {
    return UUID_RE.test(s);
}

function Breadcrumb() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    const crumbs: { label: string; href: string }[] = [];
    let href = "";

    for (const seg of segments) {
        href += `/${seg}`;
        const label = isUuid(seg)
            ? `#${seg.slice(0, 8)}`
            : (SEGMENT_LABELS[seg] ?? seg);
        crumbs.push({ label, href });
    }

    if (crumbs.length === 0) return null;

    return (
        <nav className="flex items-center gap-1 text-sm min-w-0">
            {crumbs.map((c, i) => (
                <Fragment key={c.href}>
                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />}
                    {i === crumbs.length - 1 ? (
                        <span className="text-white font-medium truncate max-w-[180px]">{c.label}</span>
                    ) : (
                        <Link
                            href={c.href}
                            className="text-slate-500 hover:text-slate-300 transition truncate max-w-[120px]"
                        >
                            {c.label}
                        </Link>
                    )}
                </Fragment>
            ))}
        </nav>
    );
}

export default function Topbar({ user }: TopbarProps) {
    const [open, setOpen] = useState(false);

    return (
        <header className="h-16 bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-6 shrink-0 z-10 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
            {/* Left: breadcrumb */}
            <div className="flex-1 min-w-0 mr-4">
                <Breadcrumb />
            </div>

            {/* Right */}
            <div className="flex items-center gap-3 shrink-0">
                {/* Notifications */}
                <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition">
                    <Bell className="w-4.5 h-4.5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-[#0b1120]" />
                </button>

                {/* User dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
                    >
                        <div className="w-7 h-7 bg-blue-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </div>
                        <span className="text-sm text-slate-300 hidden sm:block">{user.name}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {open && (
                        <div className="absolute right-0 top-12 w-52 glass-card py-1 z-50">
                            <div className="px-4 py-2 border-b border-slate-700">
                                <p className="text-xs font-medium text-white truncate">{user.name}</p>
                                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
                            >
                                <LogOut className="w-4 h-4" />
                                Esci
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
