import { Shield, BarChart2, AlertTriangle, FileText, CheckCircle } from "lucide-react";

const FEATURES = [
    {
        icon: Shield,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        tag_color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        title: "Compliance CE Intelligente",
        desc: "Verifica automatica dei 6 documenti CE obbligatori secondo il Reg. UE 2023/1230. Controllo normativa citata, firme, mandatario UE e organismo notificato NANDO. Ogni anomalia viene rilevata con codice penalità e raccomandazione specifica.",
        tags: ["Reg. UE 2023/1230", "ISO 12100", "NANDO Verified"],
        checklist: [
            "Dichiarazione CE di Conformità",
            "Manuale d'uso in italiano",
            "Fascicolo Tecnico",
            "Analisi dei Rischi",
            "Schemi Elettrici (CEI EN 60204-1)",
        ],
        checkOk: [true, true, false, true, false],
    },
    {
        icon: BarChart2,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        tag_color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        title: "Classificazione HS & TARIC",
        desc: "Sistema rule-based di suggerimento codice HS a 6 cifre e codice TARIC a 10 cifre. Calcolo automatico dei dazi applicabili, IVA e misure restrittive vigenti per l'import dalla Cina verso l'UE.",
        tags: ["Nomenclatura Combinata EU", "Dazi Antidumping", "Misure Restrittive"],
        scores: [
            { label: "8477.80.1100", pct: 94, color: "bg-blue-500" },
            { label: "8477.90.8000", pct: 71, color: "bg-indigo-400" },
            { label: "8479.89.9700", pct: 38, color: "bg-slate-600" },
        ],
    },
    {
        icon: AlertTriangle,
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        tag_color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        title: "Risk Score Engine",
        desc: "Algoritmo proprietario CE×0.55 + Doganale×0.45 che calcola il rischio globale della pratica in tempo reale. Ogni penalità è codificata con severity, descrizione e raccomandazione operativa specifica.",
        tags: ["Rischio Quantificato", "Penalità Codificate", "Azioni Consigliate"],
        gauge: { score: 42, level: "alto", penalties: 3 },
    },
    {
        icon: FileText,
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
        tag_color: "bg-green-500/10 text-green-400 border-green-500/20",
        title: "Report PDF Audit-Ready",
        desc: "Genera in un click un report PDF strutturato su 2 pagine A4 con tutti i dati della pratica: macchinario, score CE, score doganale, penalità rilevate, organismo notificato e raccomandazioni. Pronto per revisione legale o auditing.",
        tags: ["PDF A4", "Audit Trail", "2 Pagine Strutturate"],
        pdfMock: true,
    },
];

export default function FeaturesSection() {
    return (
        <section id="features" className="py-24 px-4 relative overflow-hidden">

            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/4 rounded-full blur-[150px]" />
            </div>

            <div className="relative max-w-6xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 mb-5">
                        <span className="text-slate-400 text-xs font-medium tracking-wide">Funzionalità</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Tutto ciò che serve per importare<br className="hidden sm:block" /> in regola dalla Cina
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Quattro moduli integrati che coprono ogni aspetto della compliance — dalla documentazione CE al rischio doganale.
                    </p>
                </div>

                {/* Feature blocks */}
                <div className="space-y-8">
                    {FEATURES.map((f, i) => (
                        <div
                            key={f.title}
                            className={`glass-card p-8 flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-8 lg:gap-12 items-center`}
                        >
                            {/* Text side */}
                            <div className="flex-1 min-w-0">
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${f.bg} border ${f.border} mb-5`}>
                                    <f.icon className={`w-6 h-6 ${f.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                                <p className="text-slate-400 leading-relaxed mb-5">{f.desc}</p>
                                <div className="flex flex-wrap gap-2">
                                    {f.tags.map(tag => (
                                        <span key={tag} className={`text-xs px-2.5 py-1 rounded-full border ${f.tag_color} font-medium`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Visual mock side */}
                            <div className="w-full lg:w-80 shrink-0">
                                {/* CE Checklist mock */}
                                {f.checklist && (
                                    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 space-y-3">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Documenti CE</p>
                                        {f.checklist.map((item, idx) => (
                                            <div key={item} className="flex items-center gap-3">
                                                {f.checkOk![idx]
                                                    ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                                                    : <div className="w-4 h-4 rounded-full border-2 border-red-500 shrink-0 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-red-500 rounded-full" /></div>
                                                }
                                                <span className={`text-xs ${f.checkOk![idx] ? "text-slate-300" : "text-red-400"}`}>{item}</span>
                                            </div>
                                        ))}
                                        <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                                            <span className="text-xs text-slate-500">Score CE</span>
                                            <span className="text-lg font-bold text-yellow-400">60/100</span>
                                        </div>
                                    </div>
                                )}

                                {/* HS scores mock */}
                                {f.scores && (
                                    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 space-y-4">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Codici HS Suggeriti</p>
                                        {f.scores.map(s => (
                                            <div key={s.label}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-mono text-slate-300">{s.label}</span>
                                                    <span className="text-xs font-bold text-white">{s.pct}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.pct}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-3 border-t border-slate-700">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-500">Dazio Antidumping</span>
                                                <span className="text-xs font-bold text-orange-400">+14.7%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Risk gauge mock */}
                                {f.gauge && (
                                    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5">Risk Score Globale</p>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-5xl font-bold text-orange-400">{f.gauge.score}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">su 100</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-block bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold px-3 py-1 rounded-full">ALTO</span>
                                                <p className="text-xs text-slate-500 mt-2">{f.gauge.penalties} penalità rilevate</p>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" style={{ width: "100%" }} />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                            <span>Basso</span><span>Medio</span><span>Alto</span><span>Critico</span>
                                        </div>
                                        <div className="relative -mt-3 transition-all" style={{ marginLeft: `${f.gauge.score}%`, transform: "translateX(-50%)", width: "fit-content" }}>
                                            <div className="w-3 h-3 bg-white border-2 border-orange-400 rounded-full shadow-lg shadow-orange-400/40" />
                                        </div>
                                    </div>
                                )}

                                {/* PDF mock */}
                                {f.pdfMock && (
                                    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                                                    <Shield className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-white">ImportCompliance</p>
                                                    <p className="text-[9px] text-slate-500">Report Compliance</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-slate-500">IMP-2026-0001</span>
                                        </div>
                                        {[
                                            { label: "Macchinario", val: "Pressa HAITIAN MA4600" },
                                            { label: "Fornitore", val: "Haitian Int. Co. Ltd" },
                                            { label: "Score CE", val: "80/100", color: "text-green-400" },
                                            { label: "Score Doganale", val: "75/100", color: "text-yellow-400" },
                                            { label: "Risk Score", val: "78/100 · MEDIO", color: "text-yellow-400" },
                                        ].map(row => (
                                            <div key={row.label} className="flex items-center justify-between text-[10px]">
                                                <span className="text-slate-500">{row.label}</span>
                                                <span className={`font-medium ${row.color ?? "text-slate-300"}`}>{row.val}</span>
                                            </div>
                                        ))}
                                        <div className="pt-2 mt-1 border-t border-slate-700 flex items-center justify-between">
                                            <span className="text-[9px] text-slate-600">Generato il 25/02/2026</span>
                                            <span className="text-[9px] text-green-400 flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> PDF pronto</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
