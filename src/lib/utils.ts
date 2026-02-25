import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getRiskLevel(score: number): "basso" | "medio" | "alto" | "critico" {
    if (score >= 80) return "basso";
    if (score >= 60) return "medio";
    if (score >= 40) return "alto";
    return "critico";
}

export function getRiskColor(level: string) {
    switch (level) {
        case "basso": return { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", dot: "bg-green-400" };
        case "medio": return { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", dot: "bg-yellow-400" };
        case "alto": return { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", dot: "bg-orange-400" };
        case "critico": return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", dot: "bg-red-400" };
        default: return { text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", dot: "bg-slate-400" };
    }
}

export function getStatoBadge(stato: string) {
    const map: Record<string, { label: string; color: string }> = {
        bozza: { label: "Bozza", color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
        in_lavorazione: { label: "In Lavorazione", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
        in_revisione: { label: "In Revisione", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
        approvata: { label: "Approvata", color: "text-green-400 bg-green-500/10 border-green-500/30" },
        bloccata: { label: "Bloccata", color: "text-red-400 bg-red-500/10 border-red-500/30" },
    };
    return map[stato] ?? { label: stato, color: "text-slate-400 bg-slate-500/10 border-slate-500/30" };
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return "—";
    return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}
