"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";

interface TopbarProps {
    user: { name?: string | null; email?: string | null; ruolo?: string };
}

export default function Topbar({ user }: TopbarProps) {
    const [open, setOpen] = useState(false);

    return (
        <header className="h-16 bg-[#0b1120]/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
            {/* Left: breadcrumb placeholder — pages override this via page titles */}
            <div className="flex-1" />

            {/* Right */}
            <div className="flex items-center gap-3">
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
