"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { RiskResult } from "@/lib/services/risk-engine";
import { toast } from "@/hooks/useToast";

interface RecalculateButtonProps {
    praticaId: string;
    result: RiskResult;
    userId: string;
    orgId: string;
}

export default function RecalculateButton({ praticaId, result, userId, orgId }: RecalculateButtonProps) {
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await fetch(`/api/v1/pratiche/${praticaId}/risk-score/calculate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ result }),
            });
            setSaved(true);
            toast("Risk score salvato correttamente", "success");
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "✓ Salvato" : "Salva Score"}
        </button>
    );
}
