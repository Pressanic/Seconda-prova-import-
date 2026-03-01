/**
 * POST /api/v1/pratiche/[id]/analyze-document
 *
 * Endpoint pratica-aware per l'analisi AI dei documenti con agente Claude.
 * A differenza di /api/v1/extract-document (prompt singolo, nessun contesto),
 * questo endpoint:
 * - Carica il contesto completo della pratica dal DB
 * - Usa claude-sonnet-4-6 con tool use (agente multi-step)
 * - Cross-referenzia i dati del documento con macchinario, componenti e altri documenti
 * - Ritorna lo stesso formato di extract-document (compatibile con DocumentUploadModal)
 *
 * Fallback: se ANTHROPIC_API_KEY non è configurata, ritorna 503.
 * Il modal gestisce il fallback a /extract-document (modalità legacy).
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Aumentato: agente multi-step può impiegare più dei 10s default Vercel

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    pratiche, macchinari, documenti_ce, documenti_doganali, componenti_aggiuntivi,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { EXTRACTION_PROMPTS } from "@/lib/ai/prompts";
import { runDocumentAgent, type PraticaContext } from "@/lib/ai/document-agent";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const { id } = await params;

    if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({ error: "AI non configurata", campi_estratti: null }, { status: 503 });
    }

    // ─── Verifica appartenenza pratica ────────────────────────────────────────

    const [pratica] = await db.select({
        id: pratiche.id,
        incoterms: pratiche.incoterms,
        eori_importatore: pratiche.eori_importatore,
        fornitore_cinese: pratiche.fornitore_cinese,
    }).from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id)))
        .limit(1);

    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ─── Input ────────────────────────────────────────────────────────────────

    const { file_base64, mime_type, tipo_documento } = await req.json();

    if (!file_base64 || !tipo_documento) {
        return NextResponse.json({ error: "file_base64 e tipo_documento richiesti" }, { status: 400 });
    }

    const extractionPrompt = EXTRACTION_PROMPTS[tipo_documento];
    if (!extractionPrompt) {
        return NextResponse.json({ error: "tipo_documento non supportato" }, { status: 400 });
    }

    // ─── Carica contesto pratica dal DB ───────────────────────────────────────

    const [macchinario] = await db.select({
        id: macchinari.id,
        marca: macchinari.marca,
        modello: macchinari.modello,
        numero_seriale: macchinari.numero_seriale,
        anno_produzione: macchinari.anno_produzione,
        peso_lordo_kg: macchinari.peso_lordo_kg,
        peso_netto_kg: macchinari.peso_netto_kg,
        numero_colli_macchina: macchinari.numero_colli_macchina,
        stato_macchina: macchinari.stato_macchina,
        tipo_azionamento: macchinari.tipo_azionamento,
    }).from(macchinari)
        .where(eq(macchinari.pratica_id, id))
        .limit(1);

    const [componenti, docsCE, dogsDoganali] = await Promise.all([
        macchinario
            ? db.select({
                id: componenti_aggiuntivi.id,
                descrizione: componenti_aggiuntivi.descrizione,
                numero_seriale: componenti_aggiuntivi.numero_seriale,
                ha_marcatura_ce: componenti_aggiuntivi.ha_marcatura_ce,
                peso_kg: componenti_aggiuntivi.peso_kg,
                valore_commerciale: componenti_aggiuntivi.valore_commerciale,
            }).from(componenti_aggiuntivi)
                .where(eq(componenti_aggiuntivi.macchinario_id, macchinario.id))
            : Promise.resolve([]),

        macchinario
            ? db.select({
                tipo_documento: documenti_ce.tipo_documento,
                normativa_citata: documenti_ce.normativa_citata,
                norme_armonizzate: documenti_ce.norme_armonizzate,
                data_documento: documenti_ce.data_documento,
                anomalie_rilevate: documenti_ce.anomalie_rilevate,
            }).from(documenti_ce)
                .where(eq(documenti_ce.macchinario_id, macchinario.id))
            : Promise.resolve([]),

        db.select({
            tipo_documento: documenti_doganali.tipo_documento,
            numero_riferimento_doc: documenti_doganali.numero_riferimento_doc,
            data_documento: documenti_doganali.data_documento,
            peso_doc_kg: documenti_doganali.peso_doc_kg,
            valore_commerciale: documenti_doganali.valore_commerciale,
            codice_hs_nel_doc: documenti_doganali.codice_hs_nel_doc,
            incoterms_doc: documenti_doganali.incoterms_doc,
        }).from(documenti_doganali)
            .where(eq(documenti_doganali.pratica_id, id)),
    ]);

    // Estrai numero_seriale dalla dichiarazione_ce già caricata (dati_extra in anomalie_rilevate)
    const dichCe = docsCE.find(d => d.tipo_documento === "dichiarazione_ce");
    const dichCeSeriale = (() => {
        if (!dichCe) return null;
        const anomalie = (dichCe.anomalie_rilevate as any[]) ?? [];
        const extra = anomalie.find((a: any) => a?.dati_extra)?.dati_extra;
        return extra?.numero_seriale ?? null;
    })();

    // Costruisci documenti_presenti per il contesto dell'agente
    const documenti_presenti: PraticaContext["documenti_presenti"] = {};

    for (const doc of docsCE) {
        documenti_presenti[`CE:${doc.tipo_documento}`] = {
            tipo: doc.tipo_documento,
            norme_armonizzate: (doc.norme_armonizzate as string[]) ?? [],
            normativa_citata: doc.normativa_citata,
            numero_seriale_estratto: doc.tipo_documento === "dichiarazione_ce" ? dichCeSeriale : null,
            data_documento: doc.data_documento,
        };
    }

    for (const doc of dogsDoganali) {
        documenti_presenti[`DOG:${doc.tipo_documento}`] = {
            tipo: doc.tipo_documento,
            data_documento: doc.data_documento ?? null,
        };
    }

    const context: PraticaContext = {
        pratica: {
            id: pratica.id,
            incoterms: pratica.incoterms,
            eori_importatore: pratica.eori_importatore,
            fornitore_cinese: pratica.fornitore_cinese,
        },
        macchinario: macchinario
            ? {
                marca: macchinario.marca,
                modello: macchinario.modello,
                numero_seriale: macchinario.numero_seriale,
                anno_produzione: macchinario.anno_produzione,
                peso_lordo_kg: macchinario.peso_lordo_kg ? Number(macchinario.peso_lordo_kg) : null,
                peso_netto_kg: macchinario.peso_netto_kg ? Number(macchinario.peso_netto_kg) : null,
                numero_colli_macchina: macchinario.numero_colli_macchina,
                stato_macchina: macchinario.stato_macchina,
                tipo_azionamento: macchinario.tipo_azionamento,
            }
            : null,
        componenti: componenti.map(c => ({
            id: c.id,
            descrizione: c.descrizione,
            numero_seriale: c.numero_seriale,
            ha_marcatura_ce: c.ha_marcatura_ce ?? false,
            peso_kg: c.peso_kg ? Number(c.peso_kg) : null,
            valore_commerciale: c.valore_commerciale ? Number(c.valore_commerciale) : null,
        })),
        documenti_presenti,
    };

    // ─── Esegui agente ────────────────────────────────────────────────────────

    try {
        const result = await runDocumentAgent({
            fileBase64: file_base64,
            mimeType: mime_type ?? "application/pdf",
            tipoDocumento: tipo_documento,
            extractionPrompt,
            context,
        });

        return NextResponse.json({
            campi_estratti: result.campi_estratti,
            agent_meta: {
                contesto_usato: result.contesto_usato,
                turni: result.turni,
                model: "claude-sonnet-4-6",
            },
        });
    } catch (err: any) {
        console.error("[analyze-document]", err);
        return NextResponse.json(
            { error: err.message ?? "Errore agente AI", campi_estratti: {} },
            { status: 500 }
        );
    }
}
