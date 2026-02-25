import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, macchinari } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import HSClassificationWidget from "@/components/forms/HSClassificationWidget";

export default async function ClassificazioneHSPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) notFound();

    const [macch] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);

    return (
        <div className="max-w-3xl space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-white">Classificazione HS / TARIC</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                    Inserisci la descrizione tecnica del macchinario per ottenere suggerimenti automatici sul codice HS
                </p>
            </div>

            {!macch ? (
                <div className="glass-card p-6 border border-yellow-500/20 text-yellow-300 text-sm">
                    ⚠️ Aggiungi prima i dati del macchinario per la classificazione HS.
                </div>
            ) : (
                <HSClassificationWidget
                    praticaId={id}
                    macchinarioId={macch.id}
                    initialDescription={macch.descrizione_tecnica ?? ""}
                    initialFunction={macch.funzione_principale ?? ""}
                    selectedCode={macch.codice_taric_selezionato}
                />
            )}

            {/* Info table */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Principali Capitoli HS — Macchinari Industriali</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left py-2 text-xs text-slate-500">Cap. HS</th>
                            <th className="text-left py-2 text-xs text-slate-500">Categoria</th>
                            <th className="text-left py-2 text-xs text-slate-500">Esempi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {[
                            ["8477", "Macchine gomma/plastica", "Presse a iniezione, soffiatrici"],
                            ["8462", "Presse per metalli", "Presse idrauliche, eccentriche"],
                            ["8458", "Torni per metalli", "Torni CNC, a revolver"],
                            ["8465", "Macchine legno/sughero", "Seghe CNC, fresatrici legno"],
                            ["8421", "Centrifughe/filtri", "Separatori, filtri industriali"],
                            ["8479", "Macchine uso generale", "Robot industriali, lavatrici"],
                        ].map(([cap, cat, ex]) => (
                            <tr key={cap}>
                                <td className="py-2 pr-4"><code className="text-blue-400 text-xs">{cap}</code></td>
                                <td className="py-2 pr-4 text-slate-300">{cat}</td>
                                <td className="py-2 text-slate-500 text-xs">{ex}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
