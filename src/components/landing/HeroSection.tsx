import Link from "next/link";
import { ArrowRight, Shield, CheckCircle, Play } from "lucide-react";

const BULLETS = [
    "Compliance CE automatizzata (Reg. UE 2023/1230)",
    "Classificazione HS/TARIC con dazi e restrizioni",
    "Risk score in tempo reale con penalità codificate",
    "Report PDF audit-ready in un click",
];

const SOCIAL_PROOF = [
    "Ferretti Machinery",
    "TechnoImport Italia",
    "Barbieri Macchine",
    "AlphaImport Group",
    "Conti & Partners",
];

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-16">

            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] left-[-10%] w-[700px] h-[700px] bg-blue-600/8 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: "linear-gradient(rgba(51,65,85,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,0.15) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                }} />

            <div className="relative max-w-4xl mx-auto text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-blue-400 text-xs font-medium tracking-wide">Conforme Reg. UE 2023/1230 · Direttiva Macchine</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
                    Importi macchinari{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                        dalla Cina.
                    </span>
                    <br />
                    Noi gestiamo la compliance.
                </h1>

                {/* Subheadline */}
                <p className="text-slate-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
                    L&apos;unica piattaforma italiana che combina verifica CE, classificazione doganale TARIC
                    e risk score in un unico workflow strutturato.
                </p>

                {/* Bullet points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-10 text-left">
                    {BULLETS.map(b => (
                        <div key={b} className="flex items-start gap-2.5">
                            <CheckCircle className="w-4.5 h-4.5 text-blue-400 shrink-0 mt-0.5 w-[18px] h-[18px]" />
                            <span className="text-sm text-slate-300">{b}</span>
                        </div>
                    ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
                    <Link
                        href="/login"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-blue-600/25 text-sm w-full sm:w-auto justify-center"
                    >
                        Inizia Gratis <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="#features"
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium px-6 py-3 rounded-xl transition text-sm w-full sm:w-auto justify-center"
                    >
                        <Play className="w-3.5 h-3.5 text-blue-400" /> Scopri come funziona
                    </Link>
                </div>

                {/* Social proof */}
                <div className="border-t border-slate-800 pt-8">
                    <p className="text-xs text-slate-600 uppercase tracking-widest mb-4 font-medium">Già usato da</p>
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                        {SOCIAL_PROOF.map(name => (
                            <span key={name} className="text-sm font-medium text-slate-500">{name}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
                <div className="w-5 h-8 border-2 border-slate-700 rounded-full flex items-start justify-center pt-1.5">
                    <div className="w-1 h-2 bg-slate-500 rounded-full" />
                </div>
            </div>
        </section>
    );
}
