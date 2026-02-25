import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classificazioni_hs, macchinari, pratiche } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();

    // Update macchinario with selected codes
    await db.update(macchinari)
        .set({
            codice_hs_suggerito: body.codice_hs,
            codice_taric_selezionato: body.codice_taric,
            updated_at: new Date(),
        })
        .where(eq(macchinari.pratica_id, id));

    // Save classification record
    const [classif] = await db.insert(classificazioni_hs).values({
        macchinario_id: body.macchinario_id,
        codice_hs: body.codice_hs,
        codice_taric: body.codice_taric,
        descrizione_hs: body.descrizione_hs,
        dazio_percentuale: body.dazio_percentuale?.toString(),
        iva_applicabile: body.iva_applicabile?.toString(),
        misure_restrittive: body.misure_restrittive ?? [],
    }).returning();

    return NextResponse.json(classif, { status: 201 });
}
