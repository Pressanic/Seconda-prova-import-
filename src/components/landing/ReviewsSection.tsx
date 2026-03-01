"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const REVIEWS = [
    {
        quote: "Finalmente uno strumento che capisce il workflow doganale italiano. Abbiamo ridotto i tempi di verifica CE del 70%.",
        author: "Marco Ferretti",
        role: "Responsabile Import",
        company: "Ferretti Machinery S.r.l.",
        initials: "MF",
        color: "bg-blue-700",
        featured: true,
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
] as const;

function Stars() {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            ))}
        </div>
    );
}

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, delay: i * 0.09, ease: "easeOut" as const },
    }),
};

export default function ReviewsSection() {
    const featured = REVIEWS[0];
    const rest = REVIEWS.slice(1);

    return (
        <section id="reviews" className="py-28 px-4 relative overflow-hidden">

            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-6xl mx-auto">

                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-3.5 py-1.5 mb-6">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                        <span className="text-slate-400 text-xs font-medium">Customer Stories</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Trusted by compliance teams
                    </h2>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto mb-7">
                        Real companies, measurable results. Here&apos;s what our customers say.
                    </p>
                    <div className="inline-flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-full px-5 py-2.5">
                        <Stars />
                        <span className="text-white font-bold text-sm">4.9</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400 text-sm">62 verified reviews</span>
                    </div>
                </motion.div>

                {/* Featured review */}
                <motion.div
                    className="relative bg-gradient-to-br from-blue-600/8 to-slate-800/60 border border-blue-500/20 rounded-3xl p-8 sm:p-10 mb-5 overflow-hidden"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                >
                    {/* Decorative quote */}
                    <div className="absolute top-6 right-8 text-[120px] font-black text-blue-500/6 leading-none select-none pointer-events-none">&ldquo;</div>

                    <Stars />
                    <p className="text-white text-xl sm:text-2xl font-medium leading-relaxed mt-4 mb-8 max-w-3xl">
                        &ldquo;{featured.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full ${featured.color} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                            {featured.initials}
                        </div>
                        <div>
                            <p className="font-semibold text-white">{featured.author}</p>
                            <p className="text-sm text-slate-400">{featured.role} · {featured.company}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Rest grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rest.map((r, i) => (
                        <motion.div
                            key={r.author}
                            className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-600/70 transition-colors duration-200 backdrop-blur-sm"
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-40px" }}
                        >
                            <div>
                                <Stars />
                                <p className="text-slate-300 text-sm leading-relaxed mt-3 mb-5">
                                    &ldquo;{r.quote}&rdquo;
                                </p>
                            </div>
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                                <div className={`w-9 h-9 rounded-full ${r.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                                    {r.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{r.author}</p>
                                    <p className="text-xs text-slate-500">{r.role} · {r.company}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
