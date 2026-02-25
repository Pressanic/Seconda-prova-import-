import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, risk_scores } from "@/lib/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";
import Link from "next/link";
import { Plus, FolderOpen, ArrowRight, Clock, SlidersHorizontal } from "lucide-react";
import RiskScoreBadge from "@/components/ui/RiskScoreBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";

async function getPratiche(org_id: string) {
    return db
        .select({
            id: pratiche.id,
            codice_pratica: pratiche.codice_pratica,
            nome_pratica: pratiche.nome_pratica,
            fornitore_cinese: pratiche.fornitore_cinese,
            stato: pratiche.stato,
            data_prevista_arrivo: pratiche.data_prevista_arrivo,
            created_at: pratiche.created_at,
            score_globale: risk_scores.score_globale,
            livello_rischio: risk_scores.livello_rischio,
        })
        .from(pratiche)
        .leftJoin(risk_scores, eq(risk_scores.pratica_id, pratiche.id))
        .where(eq(pratiche.organization_id, org_id))
        .orderBy(desc(pratiche.created_at));
}

export default async function PraticheListPage() {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;
    const lista = org_id ? await getPratiche(org_id) : [];

    return (
        <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Pratiche</h1>
                    <p className="text-slate-400 text-sm mt-0.5">{lista.length} pratiche trovate</p>
                </div>
                <Link
                    href="/pratiche/nuova"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-4 h-4" />
                    Nuova Pratica
                </Link>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                {!lista.length ? (
                    <div className="p-16 text-center">
                        <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 mb-4">Nessuna pratica ancora creata</p>
                        <Link href="/pratiche/nuova" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition">
                            Crea la prima pratica
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    {["Codice", "Pratica", "Fornitore", "Stato", "Score", "Arrivo Previsto", ""].map((h) => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {lista.map((p) => {
                                    const score = p.score_globale ? Number(p.score_globale) : null;
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-800/30 transition group">
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                                                    {p.codice_pratica}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 max-w-[220px]">
                                                <p className="text-sm font-medium text-white truncate">{p.nome_pratica}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm text-slate-400 truncate max-w-[160px]">{p.fornitore_cinese ?? "—"}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge stato={p.stato} />
                                            </td>
                                            <td className="px-5 py-4">
                                                {score !== null ? (
                                                    <RiskScoreBadge score={score} level={p.livello_rischio ?? "da_verificare"} size="sm" />
                                                ) : (
                                                    <span className="text-xs text-slate-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDate(p.data_prevista_arrivo)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <Link
                                                    href={`/pratiche/${p.id}`}
                                                    className="opacity-0 group-hover:opacity-100 transition text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1"
                                                >
                                                    Apri <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
