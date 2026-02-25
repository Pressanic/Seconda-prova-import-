import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit_log, users, pratiche } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Activity, User, FileText, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

const AZIONE_COLORS: Record<string, string> = {
    PRATICA_CREATA: "text-green-400 bg-green-500/10",
    PRATICA_AGGIORNATA: "text-blue-400 bg-blue-500/10",
    MACCHINARIO_CREATO: "text-purple-400 bg-purple-500/10",
    MACCHINARIO_AGGIORNATO: "text-purple-400 bg-purple-500/10",
    DOCUMENTO_CE_CARICATO: "text-yellow-400 bg-yellow-500/10",
    DOCUMENTO_DOGANALE_CARICATO: "text-orange-400 bg-orange-500/10",
    RISK_SCORE_CALCOLATO: "text-red-400 bg-red-500/10",
    LOGIN: "text-slate-400 bg-slate-500/10",
};

export default async function AuditLogPage() {
    const session = await auth();
    const user = session?.user as any;

    // Audit log is admin-only
    if (user?.ruolo !== "admin") redirect("/impostazioni");

    const org_id = user?.organization_id;

    const logs = org_id
        ? await db
            .select({
                id: audit_log.id,
                azione: audit_log.azione,
                entita_tipo: audit_log.entita_tipo,
                created_at: audit_log.created_at,
                user_id: audit_log.user_id,
                pratica_id: audit_log.pratica_id,
                ip_address: audit_log.ip_address,
            })
            .from(audit_log)
            .where(eq(audit_log.organization_id, org_id))
            .orderBy(desc(audit_log.created_at))
            .limit(200)
        : [];

    // Fetch user names and pratica codes in parallel
    const [allUsers, allPratiche] = await Promise.all([
        org_id ? db.select({ id: users.id, nome: users.nome, cognome: users.cognome, email: users.email })
            .from(users).where(eq(users.organization_id, org_id)) : [],
        org_id ? db.select({ id: pratiche.id, codice_pratica: pratiche.codice_pratica, nome_pratica: pratiche.nome_pratica })
            .from(pratiche).where(eq(pratiche.organization_id, org_id)) : [],
    ]);

    const usersMap = Object.fromEntries(allUsers.map(u => [u.id, u]));
    const praticheMap = Object.fromEntries(allPratiche.map(p => [p.id, p]));

    return (
        <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-400" />
                    Audit Log
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                    Registro attività dell&apos;organizzazione — ultime {logs.length} azioni
                </p>
            </div>

            {logs.length === 0 ? (
                <div className="glass-card p-10 text-center">
                    <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">Nessuna attività registrata</p>
                    <p className="text-sm text-slate-600 mt-1">Le azioni degli utenti appariranno qui</p>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700">
                                {["Data/Ora", "Azione", "Entità", "Utente", "Pratica"].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {logs.map((log) => {
                                const u = log.user_id ? usersMap[log.user_id] : null;
                                const p = log.pratica_id ? praticheMap[log.pratica_id] : null;
                                const color = AZIONE_COLORS[log.azione] ?? "text-slate-400 bg-slate-500/10";

                                return (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                <Clock className="w-3 h-3 shrink-0" />
                                                {log.created_at
                                                    ? new Date(log.created_at).toLocaleString("it-IT")
                                                    : "—"}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}>
                                                {log.azione.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            {log.entita_tipo ? (
                                                <span className="text-xs text-slate-400 capitalize">
                                                    {log.entita_tipo.replace(/_/g, " ")}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            {u ? (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3 h-3 text-slate-500 shrink-0" />
                                                    <span className="text-white text-xs">{u.nome} {u.cognome}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-600">Sistema</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            {p ? (
                                                <div className="flex items-center gap-1.5">
                                                    <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                                                    <span className="text-xs font-mono text-blue-400">{p.codice_pratica}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-600">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
