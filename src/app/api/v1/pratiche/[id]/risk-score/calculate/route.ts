export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateRiskScoreForPratica } from "@/lib/services/risk-score-service";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const user_id = (session.user as any).id;
    const { id } = await params;

    // Verifica pratica appartiene all'organizzazione
    const [pratica] = await db.select({ id: pratiche.id }).from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
        const result = await calculateRiskScoreForPratica(id, org_id, user_id, "manual");
        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        console.error("[risk-score/calculate]", err);
        return NextResponse.json({ error: err.message ?? "Errore calcolo score" }, { status: 500 });
    }
}
