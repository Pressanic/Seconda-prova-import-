import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, risk_scores } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import PraticaActionsClient from "@/components/pratiche/PraticaActionsClient";

const tabs = [
    { label: "Overview", href: "" },
    { label: "Macchinario", href: "/macchinario" },
    { label: "Compliance CE", href: "/compliance-ce" },
    { label: "Classificaz. HS", href: "/classificazione-hs" },
    { label: "Doc. Doganali", href: "/documenti-doganali" },
    { label: "Risk Score", href: "/risk-score" },
    { label: "Report PDF", href: "/report" },
];

export default async function PraticaLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const org_id = (session?.user as any)?.organization_id;
    const { id } = await params;

    const [pratica] = await db
        .select()
        .from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id)))
        .limit(1);

    if (!pratica) notFound();

    const [riskScore] = await db
        .select()
        .from(risk_scores)
        .where(eq(risk_scores.pratica_id, id))
        .orderBy(desc(risk_scores.calcolato_at))
        .limit(1);

    const riskColors: Record<string, string> = {
        basso: "text-green-400 bg-green-500/10 border-green-500/30",
        medio: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
        alto: "text-orange-400 bg-orange-500/10 border-orange-500/30",
        critico: "text-red-400 bg-red-500/10 border-red-500/30",
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            {/* Pratica Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/pratiche" className="text-slate-500 hover:text-slate-300 text-sm transition">Pratiche</Link>
                        <span className="text-slate-600">/</span>
                        <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{pratica.codice_pratica}</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">{pratica.nome_pratica}</h1>
                    <p className="text-sm text-slate-400 mt-0.5">{pratica.fornitore_cinese ?? "Fornitore non specificato"}</p>
                </div>

                <div className="flex items-center gap-3">
                    {riskScore && (
                        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold", riskColors[riskScore.livello_rischio] ?? "text-slate-400")}>
                            Score: {riskScore.score_globale} — {riskScore.livello_rischio?.toUpperCase()}
                        </div>
                    )}
                    <Link
                        href={`/pratiche/${id}/risk-score`}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
                    >
                        Calcola Score
                    </Link>
                    <PraticaActionsClient
                        praticaId={id}
                        nome_pratica={pratica.nome_pratica}
                        fornitore_cinese={pratica.fornitore_cinese ?? null}
                        data_prevista_arrivo={pratica.data_prevista_arrivo ?? null}
                        data_sdoganamento={pratica.data_sdoganamento ?? null}
                        note={pratica.note ?? null}
                        stato={pratica.stato}
                    />
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-0.5 border-b border-slate-700 mb-6 overflow-x-auto pb-px">
                {tabs.map((tab) => (
                    <Link
                        key={tab.label}
                        href={`/pratiche/${id}${tab.href}`}
                        className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white whitespace-nowrap transition border-b-2 border-transparent hover:border-slate-500"
                        style={{ textDecoration: "none" }}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Page Content */}
            {children}
        </div>
    );
}
