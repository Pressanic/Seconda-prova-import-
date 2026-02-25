import Link from "next/link";
import { Shield } from "lucide-react";

const LINKS = {
    Prodotto: [
        { label: "Funzionalità", href: "#features" },
        { label: "Prezzi", href: "#pricing" },
        { label: "Recensioni", href: "#reviews" },
        { label: "Changelog", href: "#" },
    ],
    Risorse: [
        { label: "Documentazione", href: "#" },
        { label: "Guida rapida", href: "#" },
        { label: "API", href: "#" },
        { label: "Status", href: "#" },
    ],
    Legale: [
        { label: "Privacy Policy", href: "#" },
        { label: "Termini di Servizio", href: "#" },
        { label: "Cookie Policy", href: "#" },
        { label: "GDPR", href: "#" },
    ],
};

export default function Footer() {
    return (
        <footer className="border-t border-slate-800 bg-slate-900/50 px-4 py-16">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">

                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
                                <Shield className="w-[18px] h-[18px] text-white" />
                            </div>
                            <span className="text-white font-bold text-base">ImportCompliance</span>
                        </Link>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                            La piattaforma italiana per la compliance CE e doganale di macchinari industriali importati dalla Cina.
                        </p>
                        <p className="text-sm text-slate-500 mt-4">
                            <a href="mailto:info@importcompliance.it" className="hover:text-slate-300 transition">
                                info@importcompliance.it
                            </a>
                        </p>
                    </div>

                    {/* Link groups */}
                    {Object.entries(LINKS).map(([group, items]) => (
                        <div key={group}>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{group}</p>
                            <ul className="space-y-3">
                                {items.map(item => (
                                    <li key={item.label}>
                                        <Link href={item.href} className="text-sm text-slate-400 hover:text-white transition">
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-600">
                        © 2026 ImportCompliance. Tutti i diritti riservati.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Tutti i sistemi operativi
                        </span>
                        <span>Dati ospitati in EU · Frankfurt</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
