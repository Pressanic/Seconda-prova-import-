export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documenti_ce, macchinari, pratiche, audit_log } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string; docId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const user_id = (session.user as any).id;
    const { id, docId } = await params;

    // Verify pratica belongs to org
    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Verify document exists and belongs to this pratica (via macchinario)
    const [macch] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);
    if (!macch) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [existing] = await db.select().from(documenti_ce)
        .where(and(eq(documenti_ce.id, docId), eq(documenti_ce.macchinario_id, macch.id))).limit(1);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const safeDate = (v: any) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

    const updates: Record<string, any> = {};
    if ("nome_file" in body)           updates.nome_file = body.nome_file;
    if ("url_storage" in body)         updates.url_storage = body.url_storage;
    if ("normativa_citata" in body)    updates.normativa_citata = body.normativa_citata;
    if ("normativa_valida" in body)    updates.normativa_valida = body.normativa_valida;
    if ("firmato" in body)             updates.firmato = body.firmato;
    if ("mandatario_ue" in body)       updates.mandatario_ue = body.mandatario_ue;
    if ("data_documento" in body)      updates.data_documento = safeDate(body.data_documento);
    if ("norme_armonizzate" in body)   updates.norme_armonizzate = body.norme_armonizzate;
    if ("stato_validazione" in body)   updates.stato_validazione = body.stato_validazione;
    if ("anomalie_rilevate" in body)   updates.anomalie_rilevate = body.anomalie_rilevate;

    let doc: any;
    try {
        [doc] = await db.update(documenti_ce).set(updates)
            .where(eq(documenti_ce.id, docId)).returning();
    } catch (err: any) {
        console.error("[documenti-ce PATCH] DB error:", err);
        return NextResponse.json({ error: err.message ?? "Errore aggiornamento documento CE" }, { status: 500 });
    }

    await db.insert(audit_log).values({
        organization_id: org_id,
        pratica_id: id,
        user_id,
        azione: "DOCUMENTO_CE_AGGIORNATO",
        entita_tipo: "documento_ce",
        entita_id: docId,
        dati_nuovi: { tipo_documento: existing.tipo_documento, ...updates },
    });

    return NextResponse.json(doc);
}
