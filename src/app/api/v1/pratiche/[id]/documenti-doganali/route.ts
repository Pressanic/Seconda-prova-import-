export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documenti_doganali, pratiche, audit_log } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const docs = await db.select().from(documenti_doganali).where(eq(documenti_doganali.pratica_id, id));
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
    const [doc] = await db.insert(documenti_doganali).values({
        pratica_id: id,
        tipo_documento: body.tipo_documento,
        nome_file: body.nome_file,
        url_storage: body.url_storage,
        stato_validazione: body.stato_validazione ?? "da_verificare",
        anomalie_rilevate: body.anomalie_rilevate ?? [],
        codice_hs_nel_doc: body.codice_hs_nel_doc,
        descrizione_merce_doc: body.descrizione_merce_doc,
        peso_doc_kg: body.peso_doc_kg?.toString(),
        valore_commerciale: body.valore_commerciale?.toString(),
        valuta: body.valuta ?? "USD",
        uploaded_by: user_id,
    }).returning();

    if (doc) {
        await db.insert(audit_log).values({
            organization_id: org_id,
            pratica_id: id,
            user_id,
            azione: "DOCUMENTO_DOGANALE_CARICATO",
            entita_tipo: "documento_doganale",
            entita_id: doc.id,
            dati_nuovi: { tipo_documento: doc.tipo_documento, nome_file: doc.nome_file },
        });
    }

    return NextResponse.json(doc, { status: 201 });
}
