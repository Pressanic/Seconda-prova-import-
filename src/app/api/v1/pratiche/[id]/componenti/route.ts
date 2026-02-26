export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { componenti_aggiuntivi, macchinari, pratiche } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET — lista componenti del macchinario della pratica
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [macchinario] = await db.select().from(macchinari)
        .where(eq(macchinari.pratica_id, id)).limit(1);
    if (!macchinario) return NextResponse.json([]);

    const componenti = await db.select().from(componenti_aggiuntivi)
        .where(eq(componenti_aggiuntivi.macchinario_id, macchinario.id));

    return NextResponse.json(componenti);
}

// POST — aggiungi componente
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [macchinario] = await db.select().from(macchinari)
        .where(eq(macchinari.pratica_id, id)).limit(1);
    if (!macchinario) return NextResponse.json({ error: "Macchinario non trovato" }, { status: 400 });

    const body = await req.json();
    const { descrizione, marca, modello, numero_seriale, quantita, peso_kg, valore_commerciale, valuta, ha_marcatura_ce, codice_hs_suggerito, note } = body;

    if (!descrizione?.trim()) {
        return NextResponse.json({ error: "descrizione obbligatoria" }, { status: 400 });
    }

    const [componente] = await db.insert(componenti_aggiuntivi).values({
        macchinario_id: macchinario.id,
        descrizione: descrizione.trim(),
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
    }).returning();

    return NextResponse.json(componente, { status: 201 });
}
