"use client";

import { useEffect } from "react";

/**
 * Forces window scroll to top on every full page load.
 *
 * Next.js App Router saves scroll positions in history.state and restores
 * them during hydration — after the load event and after most useEffects.
 * Using setTimeout(0) defers to the next macrotask, which runs reliably
 * after all of Next.js's scroll restoration logic.
 */
export default function ScrollToTop() {
    useEffect(() => {
        const t = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0 });
        }, 0);
        return () => clearTimeout(t);
    }, []);

    return null;
}
