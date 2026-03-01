"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
    { label: "Product", href: "#features" },
    { label: "Reviews", href: "#reviews" },
    { label: "Pricing", href: "#pricing" },
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
        <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                {/* Pill */}
                <div className={`flex items-center justify-between h-14 px-5 rounded-2xl transition-all duration-300 ${scrolled ? "bg-slate-800/80 backdrop-blur-md border border-slate-700/60 shadow-xl shadow-black/30" : "bg-slate-800/50 backdrop-blur-sm border border-slate-700/40 shadow-lg shadow-black/20"}`}>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 shrink-0">
                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <Shield className="w-[15px] h-[15px] text-white" />
                        </div>
                        <span className="text-white font-bold text-sm">ImportCompliance</span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-0.5">
                        {NAV_LINKS.map(l => (
                            <button
                                key={l.href}
                                onClick={() => handleAnchor(l.href)}
                                className="px-3.5 py-1.5 text-sm text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5"
                            >
                                {l.label}
                            </button>
                        ))}
                    </nav>

                    {/* Desktop CTAs */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link href="/login" className="text-sm text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5">
                            Log in
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-xl transition shadow-lg shadow-blue-600/20"
                        >
                            Get started free <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-1.5 text-slate-400 hover:text-white transition"
                        onClick={() => setOpen(!open)}
                        aria-label="Menu"
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile menu — drops below the pill */}
                {open && (
                    <div className="md:hidden mt-2 bg-slate-900/95 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
                        <div className="px-3 py-3 space-y-0.5">
                            {NAV_LINKS.map(l => (
                                <button
                                    key={l.href}
                                    onClick={() => handleAnchor(l.href)}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
                                >
                                    {l.label}
                                </button>
                            ))}
                            <div className="pt-2 mt-1 border-t border-slate-800 flex flex-col gap-2 pb-1">
                                <Link href="/login" onClick={() => setOpen(false)} className="px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition text-center">
                                    Log in
                                </Link>
                                <Link href="/login" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-3 rounded-xl transition">
                                    Get started free <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
