export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    risk_scores, pratiche, macchinari, componenti_aggiuntivi,
    documenti_ce, documenti_doganali, audit_log,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { runCrossChecks } from "@/lib/cross-check";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const user_id = (session.user as any).id;
    const { id } = await params;

    // Verifica pratica appartiene all'organizzazione
    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Carica tutti i dati necessari per il calcolo
    const [macchinario] = await db.select().from(macchinari)
        .where(eq(macchinari.pratica_id, id)).limit(1);

    const [componenti, docsCE, docsDoganali] = await Promise.all([
        macchinario
            ? db.select().from(componenti_aggiuntivi).where(eq(componenti_aggiuntivi.macchinario_id, macchinario.id))
            : Promise.resolve([]),
        macchinario
            ? db.select().from(documenti_ce).where(eq(documenti_ce.macchinario_id, macchinario.id))
            : Promise.resolve([]),
        db.select().from(documenti_doganali).where(eq(documenti_doganali.pratica_id, id)),
    ]);

    // Esegui il cross-check engine server-side
    const crossCheckResult = runCrossChecks({
        pratica: {
            eori_importatore: pratica.eori_importatore,
            incoterms: pratica.incoterms,
            porto_arrivo: pratica.porto_arrivo,
            fornitore_cinese: pratica.fornitore_cinese,
            codice_taric_selezionato: macchinario?.codice_taric_selezionato ?? null,
        },
        macchinario: macchinario ? {
            nome_macchina: macchinario.nome_macchina,
            marca: macchinario.marca,
            modello: macchinario.modello,
            numero_seriale: macchinario.numero_seriale,
            anno_produzione: macchinario.anno_produzione,
            stato_macchina: macchinario.stato_macchina as "nuova" | "usata",
            tipo_azionamento: macchinario.tipo_azionamento,
            potenza_kw: macchinario.potenza_kw ? Number(macchinario.potenza_kw) : null,
            peso_lordo_kg: macchinario.peso_lordo_kg ? Number(macchinario.peso_lordo_kg) : null,
            peso_netto_kg: macchinario.peso_netto_kg ? Number(macchinario.peso_netto_kg) : null,
            numero_colli_macchina: macchinario.numero_colli_macchina,
            robot_estrazione_integrato: macchinario.robot_estrazione_integrato ?? false,
            sistemi_pneumatici_ausiliari: macchinario.sistemi_pneumatici_ausiliari ?? false,
        } : null,
        componenti: componenti.map(c => ({
            id: c.id,
            descrizione: c.descrizione,
            numero_seriale: c.numero_seriale,
            peso_kg: c.peso_kg ? Number(c.peso_kg) : null,
            valore_commerciale: c.valore_commerciale ? Number(c.valore_commerciale) : null,
            ha_marcatura_ce: c.ha_marcatura_ce ?? false,
        })),
        documenti_ce: docsCE.map(d => ({
            tipo_documento: d.tipo_documento,
            stato_validazione: d.stato_validazione,
            norme_armonizzate: (d.norme_armonizzate as string[]) ?? [],
            normativa_citata: d.normativa_citata,
            data_documento: d.data_documento,
            componente_id: d.componente_id,
            dati_estratti: undefined,
        })),
        documenti_doganali: docsDoganali.map(d => ({
            tipo_documento: d.tipo_documento,
            stato_validazione: d.stato_validazione,
            peso_doc_kg: d.peso_doc_kg ? Number(d.peso_doc_kg) : null,
            valore_commerciale: d.valore_commerciale ? Number(d.valore_commerciale) : null,
            codice_hs_nel_doc: d.codice_hs_nel_doc,
            incoterms_doc: d.incoterms_doc,
            numero_colli_doc: d.numero_colli_doc,
            componenti_trovati: (d.componenti_trovati as any[]) ?? [],
        })),
    });

    // Calcolo score globale ponderato
    // Pesi: CE 50%, Doganale 35%, Coerenza 15%
    // Se macchina usata: CE 60%, Doganale 25%, Coerenza 15%
    const isUsata = macchinario?.stato_macchina === "usata";
    const pesoCE = isUsata ? 0.60 : 0.50;
    const pesoDog = isUsata ? 0.25 : 0.35;
    const pesoCoer = 0.15;

    const score_globale = Math.round(
        crossCheckResult.score_ce * pesoCE +
        crossCheckResult.score_doganale * pesoDog +
        crossCheckResult.score_coerenza * pesoCoer
    );

    const livello_rischio =
        score_globale >= 80 ? "basso" :
        score_globale >= 60 ? "medio" :
        score_globale >= 40 ? "alto" : "critico";

    // Salva il risultato
    const [score] = await db.insert(risk_scores).values({
        pratica_id: id,
        score_globale,
        score_compliance_ce: crossCheckResult.score_ce,
        score_doganale: crossCheckResult.score_doganale,
        score_coerenza: crossCheckResult.score_coerenza,
        livello_rischio,
        dettaglio_penalita: crossCheckResult.anomalie,
        raccomandazioni: crossCheckResult.anomalie.map(a => a.raccomandazione),
        calcolato_by: user_id,
    }).returning();

    if (score) {
        await db.insert(audit_log).values({
            organization_id: org_id,
            pratica_id: id,
            user_id,
            azione: "RISK_SCORE_CALCOLATO",
            entita_tipo: "risk_score",
            entita_id: score.id,
            dati_nuovi: { score_globale, livello_rischio },
        });
    }

    return NextResponse.json({
        ...score,
        anomalie: crossCheckResult.anomalie,
    }, { status: 201 });
}
