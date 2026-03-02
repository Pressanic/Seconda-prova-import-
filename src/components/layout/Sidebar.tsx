"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    FolderOpen,
    Plus,
    Settings,
    Shield,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
    CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
    user: { name?: string | null; email?: string | null; ruolo?: string };
}

const navItems = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Pratiche",
        href: "/pratiche",
        icon: FolderOpen,
        children: [{ label: "Nuova Pratica", href: "/pratiche/nuova", icon: Plus }],
    },
];

const bottomNavItems = [
    {
        label: "Abbonamento",
        href: "/impostazioni/billing",
        icon: CreditCard,
    },
    {
        label: "Impostazioni",
        href: "/impostazioni",
        icon: Settings,
    },
];

const roleLabels: Record<string, string> = {
    admin: "Amministratore",
    operatore: "Operatore",
    consulente: "Consulente",
};

export default function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const [expanded, setExpanded] = useState(true);

    // Persist expanded state in localStorage
    useEffect(() => {
        const saved = localStorage.getItem("sidebar-expanded");
        if (saved !== null) setExpanded(saved === "true");
    }, []);

    const toggle = () => {
        setExpanded(v => {
            const next = !v;
            localStorage.setItem("sidebar-expanded", String(next));
            return next;
        });
    };

    const isActive = (href: string) =>
        pathname === href || (href !== "/" && pathname.startsWith(href));

    const NavLink = ({ item }: { item: typeof navItems[number] }) => {
        const active = isActive(item.href);
        const isDashboard = item.href !== "/pratiche";
        return (
            <div>
                <Link
                    href={item.href}
                    title={!expanded ? item.label : undefined}
                    className={cn(
                        "relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 group overflow-hidden",
                        active && isDashboard
                            ? "bg-blue-600/15 text-blue-400 font-medium"
                            : active
                                ? "text-slate-200 bg-white/5 font-medium"
                                : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"
                    )}
                >
                    {/* Active left indicator */}
                    {active && (
                        <span className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full",
                            isDashboard ? "bg-blue-400" : "bg-slate-400"
                        )} />
                    )}
                    <item.icon className={cn("w-4 h-4 shrink-0", active && isDashboard ? "text-blue-400" : "")} />
                    <span className={cn(
                        "flex-1 whitespace-nowrap transition-all duration-200 overflow-hidden",
                        expanded ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"
                    )}>
                        {item.label}
                    </span>
                    {"children" in item && item.children && expanded && (
                        <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition shrink-0" />
                    )}
                </Link>

                {/* Submenu — only when expanded and active */}
                {"children" in item && item.children && active && expanded && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-800/80 pl-3">
                        {item.children.map((child) => (
                            <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap",
                                    isActive(child.href)
                                        ? "text-blue-400 bg-blue-600/10"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                                )}
                            >
                                <child.icon className="w-3 h-3 shrink-0" />
                                {child.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside
            className={cn(
                "bg-[#0b1120] border-r border-slate-800 flex flex-col shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
                expanded ? "w-60" : "w-14"
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-3 border-b border-slate-800 shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow shadow-blue-600/30">
                    <Shield className="w-4 h-4 text-white" />
                </div>
                <div className={cn(
                    "ml-3 overflow-hidden transition-all duration-200",
                    expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}>
                    <p className="text-sm font-bold text-white leading-tight whitespace-nowrap">ImportCompliance</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider whitespace-nowrap">v1.0</p>
                </div>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 px-1.5 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
                {navItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                ))}
            </nav>

            {/* Bottom Nav (Impostazioni) — separato visivamente */}
            <div className="px-1.5 pb-2 space-y-0.5 border-t border-slate-800/80 pt-2">
                {bottomNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        title={!expanded ? item.label : undefined}
                        className={cn(
                            "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all",
                            isActive(item.href)
                                ? "text-slate-200 bg-slate-800/60 font-medium"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                        )}
                    >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className={cn(
                            "flex-1 whitespace-nowrap transition-all duration-200 overflow-hidden",
                            expanded ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"
                        )}>
                            {item.label}
                        </span>
                    </Link>
                ))}

                {/* Toggle button */}
                <button
                    onClick={toggle}
                    title={expanded ? undefined : "Espandi sidebar"}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition text-sm"
                >
                    {expanded
                        ? <><PanelLeftClose className="w-4 h-4 shrink-0" /><span className="whitespace-nowrap text-xs">Comprimi</span></>
                        : <PanelLeftOpen className="w-4 h-4 shrink-0" />
                    }
                </button>
            </div>

            {/* User info */}
            <div className="p-1.5 border-t border-slate-800 shrink-0">
                <div className="flex items-center gap-3 px-1.5 py-2">
                    <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div className={cn(
                        "flex-1 min-w-0 overflow-hidden transition-all duration-200",
                        expanded ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"
                    )}>
                        <p className="text-xs font-medium text-white truncate whitespace-nowrap">{user.name}</p>
                        <p className="text-[10px] text-slate-500 truncate whitespace-nowrap">
                            {roleLabels[user.ruolo ?? ""] ?? user.ruolo}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
