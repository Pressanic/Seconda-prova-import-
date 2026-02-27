export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, audit_log } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const STATI_VALIDI = ["bozza", "in_lavorazione", "in_revisione", "approvata", "bloccata"] as const;

const patchSchema = z.object({
    nome_pratica: z.string().min(3).optional(),
    fornitore_cinese: z.string().optional(),
    data_prevista_arrivo: z.string().nullable().optional(),
    data_sdoganamento: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    stato: z.enum(STATI_VALIDI).optional(),
    eori_importatore: z.string().max(20).nullable().optional(),
    incoterms: z.string().max(10).nullable().optional(),
    porto_arrivo: z.string().max(100).nullable().optional(),
    spedizioniere: z.string().max(255).nullable().optional(),
    mrn_doganale: z.string().max(50).nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id } = await params;
    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(pratica);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const user_id = (session.user as any).id;
    const { id } = await params;
    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
    const updates: Record<string, unknown> = { updated_at: new Date() };
    const d = parsed.data;
    if (d.nome_pratica !== undefined) updates.nome_pratica = d.nome_pratica;
    if (d.fornitore_cinese !== undefined) updates.fornitore_cinese = d.fornitore_cinese;
    if (d.data_prevista_arrivo !== undefined) updates.data_prevista_arrivo = d.data_prevista_arrivo;
    if (d.data_sdoganamento !== undefined) updates.data_sdoganamento = d.data_sdoganamento;
    if (d.note !== undefined) updates.note = d.note;
    if (d.stato !== undefined) updates.stato = d.stato;
    if (d.eori_importatore !== undefined) updates.eori_importatore = d.eori_importatore;
    if (d.incoterms !== undefined) updates.incoterms = d.incoterms;
    if (d.porto_arrivo !== undefined) updates.porto_arrivo = d.porto_arrivo;
    if (d.spedizioniere !== undefined) updates.spedizioniere = d.spedizioniere;
    if (d.mrn_doganale !== undefined) updates.mrn_doganale = d.mrn_doganale;
    const [updated] = await db.update(pratiche).set(updates)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).returning();
    const azione = d.stato && d.stato !== pratica.stato ? "PRATICA_STATO_CAMBIATO" : "PRATICA_MODIFICATA";
    await db.insert(audit_log).values({
        organization_id: org_id, pratica_id: id, user_id, azione,
        entita_tipo: "pratica", entita_id: id,
        dati_precedenti: { nome_pratica: pratica.nome_pratica, stato: pratica.stato },
        dati_nuovi: parsed.data,
    });
    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const user_id = (session.user as any).id;
    const { id } = await params;
    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.insert(audit_log).values({
        organization_id: org_id, pratica_id: null, user_id, azione: "PRATICA_ELIMINATA",
        entita_tipo: "pratica", entita_id: id,
        dati_precedenti: { codice_pratica: pratica.codice_pratica, nome_pratica: pratica.nome_pratica },
        dati_nuovi: null,
    });
    await db.delete(pratiche).where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id)));
    return NextResponse.json({ success: true });
}
