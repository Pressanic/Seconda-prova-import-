export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documenti_ce, macchinari, pratiche, audit_log } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id } = await params;

    // Verify pratica belongs to org
    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [macch] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);
    if (!macch) return NextResponse.json({ data: [] });

    const docs = await db.select().from(documenti_ce).where(eq(documenti_ce.macchinario_id, macch.id));
    return NextResponse.json({ data: docs });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const user_id = (session.user as any).id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();

    // Sanitize date: accept only YYYY-MM-DD or null
    const safeDate = (v: any) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

    let doc: any;
    try {
        [doc] = await db.insert(documenti_ce).values({
            macchinario_id: body.macchinario_id,
            tipo_documento: body.tipo_documento,
            nome_file: body.nome_file,
            url_storage: body.url_storage,
            stato_validazione: body.stato_validazione ?? "da_verificare",
            anomalie_rilevate: body.anomalie_rilevate ?? [],
            normativa_citata: body.normativa_citata,
            normativa_valida: body.normativa_valida,
            data_documento: safeDate(body.data_documento),
            firmato: body.firmato ?? false,
            mandatario_ue: body.mandatario_ue,
            norme_armonizzate: body.norme_armonizzate ?? null,
            componente_id: body.componente_id ?? null,
            uploaded_by: user_id,
        }).returning();
    } catch (err: any) {
        console.error("[documenti-ce POST] DB error:", err);
        return NextResponse.json({ error: err.message ?? "Errore salvataggio documento CE" }, { status: 500 });
    }

    if (doc) {
        await db.insert(audit_log).values({
            organization_id: org_id,
            pratica_id: id,
            user_id,
            azione: "DOCUMENTO_CE_CARICATO",
            entita_tipo: "documento_ce",
            entita_id: doc.id,
            dati_nuovi: { tipo_documento: doc.tipo_documento, nome_file: doc.nome_file },
        });
    }

    return NextResponse.json(doc, { status: 201 });
}
