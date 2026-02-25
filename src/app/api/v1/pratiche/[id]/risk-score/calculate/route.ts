import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { risk_scores, pratiche } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const user_id = (session.user as any).id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { result } = await req.json();

    const [score] = await db.insert(risk_scores).values({
        pratica_id: id,
        score_globale: result.score_globale,
        score_compliance_ce: result.score_compliance_ce,
        score_doganale: result.score_doganale,
        livello_rischio: result.livello_rischio,
        dettaglio_penalita: result.dettaglio_penalita,
        raccomandazioni: result.raccomandazioni,
        calcolato_by: user_id,
    }).returning();

    return NextResponse.json(score, { status: 201 });
}
