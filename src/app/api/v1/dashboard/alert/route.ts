export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, risk_scores } from "@/lib/db/schema";
import { eq, and, isNull, sql, desc } from "drizzle-orm";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;

    const [rischio, senzaData] = await Promise.all([
        db.select({
            pratica_id: pratiche.id,
            codice_pratica: pratiche.codice_pratica,
            nome_pratica: pratiche.nome_pratica,
            livello_rischio: risk_scores.livello_rischio,
            score_globale: risk_scores.score_globale,
            calcolato_at: risk_scores.calcolato_at,
        })
        .from(risk_scores)
        .innerJoin(pratiche, eq(risk_scores.pratica_id, pratiche.id))
        .where(and(eq(pratiche.organization_id, org_id), sql`${risk_scores.livello_rischio} IN ('alto', 'critico')`))
        .orderBy(desc(risk_scores.calcolato_at))
        .limit(10),

        db.select({ id: pratiche.id, codice_pratica: pratiche.codice_pratica, nome_pratica: pratiche.nome_pratica })
        .from(pratiche)
        .where(and(eq(pratiche.organization_id, org_id), isNull(pratiche.data_prevista_arrivo), sql`${pratiche.stato} NOT IN ('bloccata', 'approvata')`))
        .limit(20),
    ]);

    return NextResponse.json({ alerts: rischio, pratiche_senza_data: senzaData });
}
