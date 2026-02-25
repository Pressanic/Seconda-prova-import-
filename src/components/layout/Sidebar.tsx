"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    FolderOpen,
    Plus,
    Settings,
    Shield,
    ChevronRight,
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
    const [expanded, setExpanded] = useState(false);

    const isActive = (href: string) =>
        pathname === href || (href !== "/" && pathname.startsWith(href));

    return (
        <aside
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
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
                <div className={cn("ml-3 overflow-hidden transition-all duration-300", expanded ? "opacity-100 w-auto" : "opacity-0 w-0")}>
                    <p className="text-sm font-bold text-white leading-tight whitespace-nowrap">ImportCompliance</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider whitespace-nowrap">v1.0</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-1.5 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
                {navItems.map((item) => (
                    <div key={item.href}>
                        <Link
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all group",
                                isActive(item.href) && item.href !== "/pratiche"
                                    ? "bg-blue-600/20 text-blue-400 font-medium"
                                    : isActive(item.href)
                                        ? "text-slate-200 bg-slate-800/60 font-medium"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                            )}
                        >
                            <item.icon className="w-4 h-4 shrink-0" />
                            <span className={cn(
                                "flex-1 whitespace-nowrap transition-all duration-300 overflow-hidden",
                                expanded ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"
                            )}>
                                {item.label}
                            </span>
                            {item.children && expanded && (
                                <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition shrink-0" />
                            )}
                        </Link>

                        {/* Children - only when expanded and active */}
                        {item.children && isActive(item.href) && expanded && (
                            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-800 pl-3">
                                {item.children.map((child) => (
                                    <Link
                                        key={child.href}
                                        href={child.href}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap",
                                            isActive(child.href)
                                                ? "text-blue-400 bg-blue-600/10"
                                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
                                        )}
                                    >
                                        <child.icon className="w-3 h-3 shrink-0" />
                                        {child.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* User info */}
            <div className="p-1.5 border-t border-slate-800 shrink-0">
                <div className="flex items-center gap-3 px-1.5 py-2">
                    <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div className={cn(
                        "flex-1 min-w-0 overflow-hidden transition-all duration-300",
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
