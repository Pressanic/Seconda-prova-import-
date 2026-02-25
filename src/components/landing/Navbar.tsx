"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
    { label: "Funzionalità", href: "#features" },
    { label: "Recensioni", href: "#reviews" },
    { label: "Prezzi", href: "#pricing" },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleAnchor = (href: string) => {
        setOpen(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20" : "bg-transparent"}`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 shrink-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <Shield className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                        </div>
                        <span className="text-white font-bold text-base">ImportCompliance</span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map(l => (
                            <button
                                key={l.href}
                                onClick={() => handleAnchor(l.href)}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5"
                            >
                                {l.label}
                            </button>
                        ))}
                    </nav>

                    {/* Desktop CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/login" className="text-sm text-slate-400 hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/5">
                            Accedi
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-blue-600/20"
                        >
                            Prova Gratis <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 text-slate-400 hover:text-white transition"
                        onClick={() => setOpen(!open)}
                        aria-label="Menu"
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
                    <div className="px-4 py-4 space-y-1">
                        {NAV_LINKS.map(l => (
                            <button
                                key={l.href}
                                onClick={() => handleAnchor(l.href)}
                                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            >
                                {l.label}
                            </button>
                        ))}
                        <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                            <Link href="/login" onClick={() => setOpen(false)} className="px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition text-center">
                                Accedi
                            </Link>
                            <Link href="/login" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-3 rounded-lg transition">
                                Prova Gratis <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
