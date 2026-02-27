export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documenti_doganali, pratiche, audit_log } from "@/lib/db/schema";
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

    // Verify document belongs to this pratica
    const [existing] = await db.select().from(documenti_doganali)
        .where(and(eq(documenti_doganali.id, docId), eq(documenti_doganali.pratica_id, id))).limit(1);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();

    const updates: Record<string, any> = {};
    if ("nome_file" in body)             updates.nome_file = body.nome_file;
    if ("url_storage" in body)           updates.url_storage = body.url_storage;
    if ("codice_hs_nel_doc" in body)     updates.codice_hs_nel_doc = body.codice_hs_nel_doc;
    if ("valore_commerciale" in body)    updates.valore_commerciale = body.valore_commerciale?.toString();
    if ("valuta" in body)                updates.valuta = body.valuta;
    if ("peso_doc_kg" in body)           updates.peso_doc_kg = body.peso_doc_kg?.toString();
    if ("descrizione_merce_doc" in body) updates.descrizione_merce_doc = body.descrizione_merce_doc;
    if ("incoterms_doc" in body)         updates.incoterms_doc = body.incoterms_doc;
    if ("numero_colli_doc" in body)      updates.numero_colli_doc = body.numero_colli_doc;
    if ("stato_validazione" in body)     updates.stato_validazione = body.stato_validazione;
    if ("anomalie_rilevate" in body)     updates.anomalie_rilevate = body.anomalie_rilevate;

    let doc: any;
    try {
        [doc] = await db.update(documenti_doganali).set(updates)
            .where(eq(documenti_doganali.id, docId)).returning();
    } catch (err: any) {
        console.error("[documenti-doganali PATCH] DB error:", err);
        return NextResponse.json({ error: err.message ?? "Errore aggiornamento documento doganale" }, { status: 500 });
    }

    await db.insert(audit_log).values({
        organization_id: org_id,
        pratica_id: id,
        user_id,
        azione: "DOCUMENTO_DOGANALE_AGGIORNATO",
        entita_tipo: "documento_doganale",
        entita_id: docId,
        dati_nuovi: { tipo_documento: existing.tipo_documento, ...updates },
    });

    return NextResponse.json(doc);
}
