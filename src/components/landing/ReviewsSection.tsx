import { Star } from "lucide-react";

const REVIEWS = [
    {
        quote: "Finalmente uno strumento che capisce il workflow doganale italiano. Abbiamo ridotto i tempi di verifica CE del 70%.",
        author: "Marco Ferretti",
        role: "Responsabile Import",
        company: "Ferretti Machinery S.r.l.",
        initials: "MF",
        color: "bg-blue-700",
    },
    {
        quote: "Il risk score ci ha salvato da un blocco doganale. Avevamo il codice HS sbagliato sulla fattura commerciale.",
        author: "Giulia Romano",
        role: "Compliance Officer",
        company: "TechnoImport Italia",
        initials: "GR",
        color: "bg-indigo-700",
    },
    {
        quote: "Perfetto per una PMI come noi. Prima pagavamo un consulente esterno per ogni pratica. Ora gestiamo tutto internamente.",
        author: "Luca Barbieri",
        role: "Titolare",
        company: "Barbieri Macchine Utensili",
        initials: "LB",
        color: "bg-violet-700",
    },
    {
        quote: "L'integrazione con NANDO per la verifica degli organismi notificati è un dettaglio che fa la differenza. Molto professionale.",
        author: "Sara Conti",
        role: "Consulente Legale",
        company: "Conti & Partners Studio",
        initials: "SC",
        color: "bg-blue-800",
    },
    {
        quote: "Usiamo il report PDF per ogni import. I nostri clienti sono sempre impressionati dalla qualità della documentazione fornita.",
        author: "Roberto Mancini",
        role: "Direttore Operations",
        company: "AlphaImport Group",
        initials: "RM",
        color: "bg-sky-700",
    },
    {
        quote: "Setup in 10 minuti, prima pratica creata in 15. Interfaccia chiara, nessuna formazione necessaria per il team.",
        author: "Chiara Vitale",
        role: "Office Manager",
        company: "Vitale Automation",
        initials: "CV",
        color: "bg-teal-700",
    },
];

function Stars() {
    return (
        <div className="flex gap-0.5 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
        </div>
    );
}

export default function ReviewsSection() {
    return (
        <section id="reviews" className="py-24 px-4 relative overflow-hidden">

            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-6xl mx-auto">

                {/* Header */}
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 mb-5">
                        <span className="text-slate-400 text-xs font-medium tracking-wide">Recensioni</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Fidato da importatori italiani
                    </h2>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">
                        Aziende reali, risultati concreti. Ecco cosa dicono i nostri clienti.
                    </p>

                    {/* Aggregate rating */}
                    <div className="inline-flex items-center gap-3 mt-6 bg-slate-800/60 border border-slate-700 rounded-full px-5 py-2.5">
                        <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            ))}
                        </div>
                        <span className="text-white font-bold text-sm">4.9</span>
                        <span className="text-slate-500 text-sm">·</span>
                        <span className="text-slate-400 text-sm">62 recensioni verificate</span>
                    </div>
                </div>

                {/* Reviews grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {REVIEWS.map((r) => (
                        <div key={r.author} className="glass-card p-6 flex flex-col justify-between hover:border-slate-600 transition-colors duration-200">
                            <div>
                                <Stars />
                                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                    &ldquo;{r.quote}&rdquo;
                                </p>
                            </div>
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-700/60">
                                <div className={`w-9 h-9 rounded-full ${r.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                                    {r.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{r.author}</p>
                                    <p className="text-xs text-slate-500">{r.role} · {r.company}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
