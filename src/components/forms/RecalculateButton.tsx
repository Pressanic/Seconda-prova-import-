"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/useToast";

export default function RecalculateButton({ praticaId }: { praticaId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRecalculate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/pratiche/${praticaId}/risk-score/calculate`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Errore nel calcolo");
            toast("Risk score aggiornato", "success");
            router.refresh();
        } catch {
            toast("Errore nel calcolo del risk score", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleRecalculate}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Ricalcola
        </button>
    );
}
