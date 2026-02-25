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
    if (!parsed.success) {
        return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
        updated_at: new Date(),
    };
    if (parsed.data.nome_pratica !== undefined) updates.nome_pratica = parsed.data.nome_pratica;
    if (parsed.data.fornitore_cinese !== undefined) updates.fornitore_cinese = parsed.data.fornitore_cinese;
    if (parsed.data.data_prevista_arrivo !== undefined) updates.data_prevista_arrivo = parsed.data.data_prevista_arrivo;
    if (parsed.data.data_sdoganamento !== undefined) updates.data_sdoganamento = parsed.data.data_sdoganamento;
    if (parsed.data.note !== undefined) updates.note = parsed.data.note;
    if (parsed.data.stato !== undefined) updates.stato = parsed.data.stato;

    const [updated] = await db.update(pratiche)
        .set(updates)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id)))
        .returning();

    // Determine action label
    const azione = parsed.data.stato && parsed.data.stato !== pratica.stato
        ? "PRATICA_STATO_CAMBIATO"
        : "PRATICA_MODIFICATA";

    await db.insert(audit_log).values({
        organization_id: org_id,
        pratica_id: id,
        user_id,
        azione,
        entita_tipo: "pratica",
        entita_id: id,
        dati_precedenti: {
            nome_pratica: pratica.nome_pratica,
            fornitore_cinese: pratica.fornitore_cinese,
            stato: pratica.stato,
        },
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

    // Write audit log before deletion (pratica_id FK will cascade)
    await db.insert(audit_log).values({
        organization_id: org_id,
        pratica_id: null,
        user_id,
        azione: "PRATICA_ELIMINATA",
        entita_tipo: "pratica",
        entita_id: id,
        dati_precedenti: {
            codice_pratica: pratica.codice_pratica,
            nome_pratica: pratica.nome_pratica,
        },
        dati_nuovi: null,
    });

    await db.delete(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id)));

    return NextResponse.json({ success: true });
}
