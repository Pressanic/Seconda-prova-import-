import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Shield, Mail, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function UtentiPage() {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;

    const lista = org_id
        ? await db.select().from(users).where(eq(users.organization_id, org_id))
        : [];

    const roleLabels: Record<string, string> = {
        admin: "Amministratore",
        operatore: "Operatore",
        consulente: "Consulente",
    };

    return (
        <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Gestione Utenti</h1>
                <p className="text-slate-400 text-sm mt-0.5">{lista.length} utenti nell&apos;organizzazione</p>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            {["Nome", "Email", "Ruolo", "Stato", "Ultimo Login"].map((h) => (
                                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {lista.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-800/30 transition">
                                <td className="px-5 py-4">
                                    <p className="text-sm font-medium text-white">{u.nome} {u.cognome}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                        <Mail className="w-3.5 h-3.5" />{u.email}
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                                        {roleLabels[u.ruolo] ?? u.ruolo}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    {u.attivo ? (
                                        <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3.5 h-3.5" /> Attivo</span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3.5 h-3.5" /> Disattivato</span>
                                    )}
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatDate(u.last_login?.toString())}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
