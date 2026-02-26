export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { componenti_aggiuntivi, macchinari, pratiche } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH — aggiorna componente
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; componenteId: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id, componenteId } = await params;

    // Verifica ownership tramite pratica → macchinario → componente
    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [macchinario] = await db.select().from(macchinari)
        .where(eq(macchinari.pratica_id, id)).limit(1);
    if (!macchinario) return NextResponse.json({ error: "Macchinario non trovato" }, { status: 404 });

    const body = await req.json();
    const { descrizione, marca, modello, numero_seriale, quantita, peso_kg, valore_commerciale, valuta, ha_marcatura_ce, codice_hs_suggerito, note } = body;

    const [updated] = await db.update(componenti_aggiuntivi)
        .set({
            descrizione: descrizione?.trim(),
            marca: marca?.trim() || null,
            modello: modello?.trim() || null,
            numero_seriale: numero_seriale?.trim() || null,
            quantita: quantita ?? 1,
            peso_kg: peso_kg ?? null,
            valore_commerciale: valore_commerciale ?? null,
            valuta: valuta ?? "EUR",
            ha_marcatura_ce: ha_marcatura_ce ?? false,
            codice_hs_suggerito: codice_hs_suggerito?.trim() || null,
            note: note?.trim() || null,
        })
        .where(and(
            eq(componenti_aggiuntivi.id, componenteId),
            eq(componenti_aggiuntivi.macchinario_id, macchinario.id)
        ))
        .returning();

    if (!updated) return NextResponse.json({ error: "Componente non trovato" }, { status: 404 });
    return NextResponse.json(updated);
}

// DELETE — elimina componente
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; componenteId: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id, componenteId } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [macchinario] = await db.select().from(macchinari)
        .where(eq(macchinari.pratica_id, id)).limit(1);
    if (!macchinario) return NextResponse.json({ error: "Macchinario non trovato" }, { status: 404 });

    await db.delete(componenti_aggiuntivi)
        .where(and(
            eq(componenti_aggiuntivi.id, componenteId),
            eq(componenti_aggiuntivi.macchinario_id, macchinario.id)
        ));

    return NextResponse.json({ success: true });
}
