"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, CheckCircle } from "lucide-react";

export default function FinalCTASection() {
    return (
        <section className="py-24 px-4">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    className="relative bg-gradient-to-br from-blue-600/10 to-indigo-600/6 border border-blue-500/20 rounded-3xl p-10 sm:p-16 text-center overflow-hidden"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                >
                    {/* Decorative glows */}
                    <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/6 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative">
                        {/* Icon */}
                        <motion.div
                            className="inline-flex items-center justify-center w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-7"
                            initial={{ scale: 0, rotate: -10 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
                        >
                            <Shield className="w-7 h-7 text-blue-400" />
                        </motion.div>

                        {/* Headline */}
                        <motion.h2
                            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight"
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            Clear your first import<br className="hidden sm:block" /> in under 15 minutes.
                        </motion.h2>

                        {/* Subheadline */}
                        <motion.p
                            className="text-slate-400 text-lg max-w-xl mx-auto mb-9"
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            No consultant fees, no paperwork surprises.<br className="hidden sm:block" /> Start free, scale as you grow.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, delay: 0.3 }}
                        >
                            <Link
                                href="/login"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3.5 rounded-xl transition shadow-lg shadow-blue-600/25 text-sm w-full sm:w-auto justify-center"
                            >
                                Start for free <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="#pricing"
                                className="flex items-center gap-2 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 bg-slate-800/40 hover:bg-slate-800/70 px-7 py-3.5 rounded-xl transition text-sm w-full sm:w-auto justify-center"
                            >
                                View pricing
                            </a>
                        </motion.div>

                        {/* Trust signals */}
                        <motion.div
                            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                        >
                            {["No credit card required", "GDPR compliant", "Data stored in EU"].map(t => (
                                <span key={t} className="flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5 text-slate-600" />
                                    {t}
                                </span>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
