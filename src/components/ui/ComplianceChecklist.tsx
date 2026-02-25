"use client";

import { CheckCircle, AlertTriangle, XCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckState = "verificato" | "attenzione" | "non_compliant" | "da_verificare";

interface CheckItem {
    label: string;
    stato: CheckState;
    detail?: string;
}

const stateConfig: Record<CheckState, { icon: React.ElementType; classes: string; label: string }> = {
    verificato: { icon: CheckCircle, classes: "text-green-400", label: "Verificato" },
    attenzione: { icon: AlertTriangle, classes: "text-yellow-400", label: "Attenzione" },
    non_compliant: { icon: XCircle, classes: "text-red-400", label: "Non Conforme" },
    da_verificare: { icon: Circle, classes: "text-slate-500", label: "Da Verificare" },
};

export default function ComplianceChecklist({ items }: { items: CheckItem[] }) {
    return (
        <div className="space-y-1">
            {items.map((item, i) => {
                const { icon: Icon, classes, label } = stateConfig[item.stato];
                return (
                    <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-slate-800/30 transition">
                        <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", classes)} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-slate-200">{item.label}</p>
                                <span className={cn("text-xs font-medium shrink-0", classes)}>{label}</span>
                            </div>
                            {item.detail && <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export type { CheckItem, CheckState };
