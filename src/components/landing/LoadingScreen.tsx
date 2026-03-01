"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";

export default function LoadingScreen() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Wait for both: minimum display time (450ms) + document fully loaded.
        // This ensures all fonts/assets are ready before animations start,
        // preventing jank on the first paint.
        const minDelay = new Promise<void>(resolve => setTimeout(resolve, 450));
        const docReady = new Promise<void>(resolve => {
            if (document.readyState === "complete") {
                resolve();
            } else {
                window.addEventListener("load", () => resolve(), { once: true });
            }
        });
        Promise.all([minDelay, docReady]).then(() => setVisible(false));
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col items-center justify-center"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
                >
                    {/* Logo mark */}
                    <motion.div
                        className="flex items-center gap-3 mb-10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                        <motion.div
                            className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-600/30"
                            initial={{ scale: 0.7 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
                        >
                            <Shield className="w-[22px] h-[22px] text-white" />
                        </motion.div>
                        <motion.span
                            className="text-white font-bold text-xl tracking-tight"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            ImportCompliance
                        </motion.span>
                    </motion.div>

                    {/* Progress bar */}
                    <div className="w-40 h-[2px] bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.45, ease: "easeInOut" }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
