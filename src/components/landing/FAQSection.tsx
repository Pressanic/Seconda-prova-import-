"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const FAQS = [
    {
        q: "Which CE documents are required to import machinery into the EU?",
        a: "For machinery subject to Directive 2006/42/CE, you need: EU Declaration of Conformity, CE marking on the machine, user manual in the language of the destination country, and the Technical Construction File (kept by the manufacturer). For machinery with electrical risks, electrical diagrams compliant with EN 60204-1 are also required. Import Compliance automatically checks which documents are present and which are missing.",
    },
    {
        q: "How is the HS code for my machinery determined?",
        a: "The HS (Harmonized System) code is determined based on the machine's primary function and technical specifications. Import Compliance AI analyzes the data you provide and suggests the most accurate code — typically from Chapter 84 (machinery) or Chapter 85 (electrical equipment). The TARIC code extends this with EU-specific subdivisions and is what customs actually uses.",
    },
    {
        q: "What happens if customs blocks my shipment?",
        a: "A customs block can occur due to missing or non-compliant documentation, an incorrect HS code, or CE marking issues. Import Compliance identifies potential blockers before the shipment arrives, giving you time to correct them. If a block still occurs, the audit report contains all the information needed for rapid customs clearance.",
    },
    {
        q: "Is CE marking affixed in China valid in the EU?",
        a: "Yes, a CE marking affixed by a Chinese manufacturer is legally valid in the EU, provided it is backed by a proper EU Declaration of Conformity and a complete Technical Construction File. The Declaration must reference the applicable EU directives and harmonized standards. Import Compliance verifies the coherence between the marking, the declaration, and the standards cited.",
    },
    {
        q: "What is Machinery Directive 2006/42/CE?",
        a: "Directive 2006/42/CE is the main EU regulation for machinery placed on the EU market. It defines essential health and safety requirements and requires manufacturers (or importers) to affix the CE marking and issue the EU Declaration of Conformity before the machine is placed in service. It will be replaced by Regulation (EU) 2023/1230, which enters into force on 20 January 2027.",
    },
    {
        q: "How is the risk score calculated?",
        a: "The risk score (0–100) is calculated by the Import Compliance engine based on several factors: missing or incomplete CE documents, technical inconsistencies in the Declaration of Conformity, non-harmonized standards referenced, HS code mismatches, and missing customs documents. A score below 30 indicates low risk (cleared for import), 30–60 medium risk (action required), above 60 high risk (likely customs block).",
    },
    {
        q: "Can I use the platform without an EORI number?",
        a: "You can create dossiers and verify CE documentation without an EORI number. However, the EORI (Economic Operators Registration and Identification) number is mandatory for submitting customs declarations in the EU. Import Compliance reminds you to include it before completing the customs documentation phase.",
    },
    {
        q: "How long does CE compliance verification take?",
        a: "Uploading documents and receiving the initial AI analysis takes approximately 5–10 minutes per dossier. The full cross-check — CE documents, HS code, risk score — completes within 30 seconds of document processing. Compared to manual verification by an external consultant (typically 2–5 business days), Import Compliance reduces turnaround time by over 95%.",
    },
] as const;

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
    const [open, setOpen] = useState(false);

    return (
        <motion.div
            className="border-b border-slate-700/60 last:border-0"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.4, delay: index * 0.04, ease: "easeOut" }}
        >
            <button
                className="flex items-center justify-between w-full py-5 text-left gap-6 group"
                onClick={() => setOpen(o => !o)}
            >
                <span className={`font-medium text-sm sm:text-base leading-snug transition-colors ${open ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                    {q}
                </span>
                <motion.div
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="shrink-0 w-6 h-6 rounded-full bg-slate-700/60 flex items-center justify-center"
                >
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            height: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
                            opacity: { duration: 0.2 },
                        }}
                        className="overflow-hidden"
                    >
                        <p className="text-slate-400 text-sm leading-relaxed pb-5 pr-10">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function FAQSection() {
    return (
        <section id="faq" className="py-28 px-4 relative overflow-hidden">

            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-600/4 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-3xl mx-auto">

                {/* Header */}
                <motion.div
                    className="text-center mb-14"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-3.5 py-1.5 mb-6">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                        <span className="text-slate-400 text-xs font-medium">FAQ</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Frequently asked questions
                    </h2>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">
                        Everything you need to know about CE compliance and machinery import.
                    </p>
                </motion.div>

                {/* Accordion */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 sm:px-8 backdrop-blur-sm">
                    {FAQS.map((faq, i) => (
                        <FAQItem key={faq.q} q={faq.q} a={faq.a} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
