export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { macchinari, pratiche } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [macch] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);
    return NextResponse.json(macch ?? null);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const [macch] = await db.insert(macchinari).values({
        pratica_id: id,
        nome_macchina: body.nome_macchina,
        modello: body.modello,
        anno_produzione: body.anno_produzione,
        numero_seriale: body.numero_seriale,
        stato_macchina: body.stato_macchina,
        potenza_kw: body.potenza_kw?.toString(),
        ha_sistemi_idraulici: body.ha_sistemi_idraulici ?? false,
        ha_sistemi_pneumatici: body.ha_sistemi_pneumatici ?? false,
        ha_automazioni_robot: body.ha_automazioni_robot ?? false,
        paese_destinazione: body.paese_destinazione ?? "IT",
        descrizione_tecnica: body.descrizione_tecnica,
        funzione_principale: body.funzione_principale,
        tipologia_lavorazione: body.tipologia_lavorazione,
    }).returning();

    return NextResponse.json(macch, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const [macch] = await db.update(macchinari)
        .set({
            nome_macchina: body.nome_macchina,
            modello: body.modello,
            anno_produzione: body.anno_produzione,
            numero_seriale: body.numero_seriale,
            stato_macchina: body.stato_macchina,
            potenza_kw: body.potenza_kw?.toString(),
            ha_sistemi_idraulici: body.ha_sistemi_idraulici ?? false,
            ha_sistemi_pneumatici: body.ha_sistemi_pneumatici ?? false,
            ha_automazioni_robot: body.ha_automazioni_robot ?? false,
            paese_destinazione: body.paese_destinazione ?? "IT",
            descrizione_tecnica: body.descrizione_tecnica,
            funzione_principale: body.funzione_principale,
            tipologia_lavorazione: body.tipologia_lavorazione,
            updated_at: new Date(),
        })
        .where(eq(macchinari.pratica_id, id))
        .returning();

    return NextResponse.json(macch);
}
