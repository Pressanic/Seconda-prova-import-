export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { macchinari, pratiche } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

function pickFields(body: any) {
    return {
        nome_macchina: body.nome_macchina,
        marca: body.marca ?? null,
        modello: body.modello,
        anno_produzione: body.anno_produzione,
        numero_seriale: body.numero_seriale,
        stato_macchina: body.stato_macchina,
        tipo_azionamento: body.tipo_azionamento ?? null,
        forza_chiusura_kn: body.forza_chiusura_kn?.toString() ?? null,
        potenza_kw: body.potenza_kw?.toString() ?? null,
        tensione_alimentazione_v: body.tensione_alimentazione_v ?? null,
        volume_iniezione_cm3: body.volume_iniezione_cm3?.toString() ?? null,
        diametro_vite_mm: body.diametro_vite_mm?.toString() ?? null,
        distanza_colonne_mm: body.distanza_colonne_mm?.toString() ?? null,
        pressione_iniezione_bar: body.pressione_iniezione_bar?.toString() ?? null,
        peso_lordo_kg: body.peso_lordo_kg?.toString() ?? null,
        peso_netto_kg: body.peso_netto_kg?.toString() ?? null,
        numero_colli_macchina: body.numero_colli_macchina ?? null,
        lunghezza_cm: body.lunghezza_cm ?? null,
        larghezza_cm: body.larghezza_cm ?? null,
        altezza_cm: body.altezza_cm ?? null,
        robot_estrazione_integrato: body.robot_estrazione_integrato ?? false,
        sistemi_pneumatici_ausiliari: body.sistemi_pneumatici_ausiliari ?? false,
        descrizione_tecnica: body.descrizione_tecnica,
        funzione_principale: body.funzione_principale,
        // legacy fields mantenuti per compatibilità
        ha_sistemi_idraulici: body.tipo_azionamento === "idraulico" || body.tipo_azionamento === "ibrido",
        ha_sistemi_pneumatici: body.sistemi_pneumatici_ausiliari ?? false,
        ha_automazioni_robot: body.robot_estrazione_integrato ?? false,
        paese_destinazione: body.paese_destinazione ?? "IT",
    };
}

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
    const [macch] = await db.insert(macchinari).values({ pratica_id: id, ...pickFields(body) }).returning();
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
        .set({ ...pickFields(body), updated_at: new Date() })
        .where(eq(macchinari.pratica_id, id)).returning();
    return NextResponse.json(macch);
}
