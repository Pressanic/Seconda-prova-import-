import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, risk_scores } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;

    const alerts = await db
        .select({
            pratica_id: pratiche.id,
            codice_pratica: pratiche.codice_pratica,
            nome_pratica: pratiche.nome_pratica,
            livello_rischio: risk_scores.livello_rischio,
            score_globale: risk_scores.score_globale,
            calcolato_at: risk_scores.calcolato_at,
        })
        .from(risk_scores)
        .innerJoin(pratiche, eq(risk_scores.pratica_id, pratiche.id))
        .where(and(
            eq(pratiche.organization_id, org_id),
            sql`${risk_scores.livello_rischio} IN ('alto', 'critico')`
        ))
        .orderBy(desc(risk_scores.calcolato_at))
        .limit(10);

    return NextResponse.json({ alerts });
}
