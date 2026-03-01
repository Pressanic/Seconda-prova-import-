/**
 * risk-score-service.ts
 * Logica di calcolo del risk score estratta dal route handler.
 *
 * Usata da:
 * - POST /api/v1/pratiche/[id]/risk-score/calculate  (trigger manuale)
 * - after() in POST /api/v1/pratiche/[id]/documenti-ce      (auto dopo upload)
 * - after() in POST /api/v1/pratiche/[id]/documenti-doganali (auto dopo upload)
 *
 * Non esegue autenticazione — l'auth è già verificata nel route chiamante.
 */

import { db } from "@/lib/db";
import {
    risk_scores, pratiche, macchinari, componenti_aggiuntivi,
    documenti_ce, documenti_doganali, audit_log,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runCrossChecks, type CrossCheckAnomalia } from "@/lib/cross-check";

// ─── Azioni richieste ─────────────────────────────────────────────────────────

export interface AzioneRichiesta {
    priorita: "critica" | "importante" | "consigliata";
    area: string;
    titolo: string;
    descrizione: string;
    link: string;
    codice_anomalia: string;
}

function getAzioneLink(codice: string, praticaId: string): string {
    if (codice.startsWith("CE_") || codice.startsWith("CE-")) return `/pratiche/${praticaId}/compliance-ce`;
    if (codice.startsWith("MACCH_")) return `/pratiche/${praticaId}/macchinario`;
    if (codice.startsWith("PRATICA_")) return `/pratiche/${praticaId}`;
    return `/pratiche/${praticaId}/documenti-doganali`;
}

function getAzioneArea(a: CrossCheckAnomalia): string {
    if (a.codice.startsWith("MACCH_")) return "macchinario";
    if (a.codice.startsWith("PRATICA_")) return "pratica";
    if (a.categoria === "ce") return "ce";
    if (a.categoria === "doganale") return "doganale";
    if (a.codice.startsWith("CE_")) return "ce";
    return "doganale";
}

function buildAzioni(anomalie: CrossCheckAnomalia[], praticaId: string): AzioneRichiesta[] {
    const ord = { critica: 0, alta: 1, media: 2, bassa: 3 } as const;
    return anomalie
        .filter(a => a.severita !== "bassa")
        .sort((a, b) => ord[a.severita] - ord[b.severita])
        .map(a => ({
            priorita: a.severita === "critica" ? "critica" : a.severita === "alta" ? "importante" : "consigliata",
            area: getAzioneArea(a),
            titolo: a.messaggio,
            descrizione: a.raccomandazione,
            link: getAzioneLink(a.codice, praticaId),
            codice_anomalia: a.codice,
        }));
}

// ─── Calcolo principale ───────────────────────────────────────────────────────

export interface RiskScoreResult {
    id: string;
    pratica_id: string;
    score_globale: number;
    livello_rischio: string;
    score_compliance_ce: number;
    score_doganale: number;
    score_coerenza: number;
    anomalie: CrossCheckAnomalia[];
}

/**
 * Calcola e persiste il risk score per una pratica.
 * Chiamare solo dopo aver verificato che la pratica appartiene all'organizzazione.
 *
 * @param praticaId  UUID della pratica
 * @param orgId      UUID dell'organizzazione (per audit log)
 * @param userId     UUID dell'utente che ha scatenato il calcolo (per audit log)
 * @param trigger    "manual" | "auto_upload" — usato nell'audit log
 */
export async function calculateRiskScoreForPratica(
    praticaId: string,
    orgId: string,
    userId: string,
    trigger: "manual" | "auto_upload" = "manual",
): Promise<RiskScoreResult> {

    // Carica pratica
    const [pratica] = await db.select().from(pratiche)
        .where(eq(pratiche.id, praticaId)).limit(1);
    if (!pratica) throw new Error(`Pratica ${praticaId} non trovata`);

    // Carica macchinario
    const [macchinario] = await db.select().from(macchinari)
        .where(eq(macchinari.pratica_id, praticaId)).limit(1);

    // Carica dati correlati in parallelo
    const [componenti, docsCE, dogsDoganali] = await Promise.all([
        macchinario
            ? db.select().from(componenti_aggiuntivi).where(eq(componenti_aggiuntivi.macchinario_id, macchinario.id))
            : Promise.resolve([]),
        macchinario
            ? db.select().from(documenti_ce).where(eq(documenti_ce.macchinario_id, macchinario.id))
            : Promise.resolve([]),
        db.select().from(documenti_doganali).where(eq(documenti_doganali.pratica_id, praticaId)),
    ]);

    // Esegui il cross-check engine
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
        documenti_ce: docsCE.map(d => {
            const anomalieRaw = (d.anomalie_rilevate as any[]) ?? [];
            const datiExtra = anomalieRaw.find((a: any) => a?.dati_extra)?.dati_extra;
            const anomalieReali = anomalieRaw.filter((a: any) => !a?.dati_extra && a?.codice);
            return {
                tipo_documento: d.tipo_documento,
                stato_validazione: d.stato_validazione,
                norme_armonizzate: (d.norme_armonizzate as string[]) ?? [],
                normativa_citata: d.normativa_citata,
                data_documento: d.data_documento,
                componente_id: d.componente_id,
                dati_estratti: datiExtra ?? undefined,
                anomalie_rilevate: anomalieReali,
            };
        }),
        documenti_doganali: dogsDoganali.map(d => ({
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

    // Calcolo score ponderato
    // Pesi: CE 50%, Doganale 35%, Coerenza 15% (macchina nuova)
    //       CE 60%, Doganale 25%, Coerenza 15% (macchina usata)
    const isUsata = macchinario?.stato_macchina === "usata";
    const pesoCE  = isUsata ? 0.60 : 0.50;
    const pesoDog = isUsata ? 0.25 : 0.35;
    const pesoCoer = 0.15;

    const score_globale = Math.min(
        crossCheckResult.cap_score_globale,
        Math.round(
            crossCheckResult.score_ce       * pesoCE  +
            crossCheckResult.score_doganale * pesoDog +
            crossCheckResult.score_coerenza * pesoCoer
        )
    );

    const livello_rischio =
        score_globale >= 80 ? "basso"  :
        score_globale >= 60 ? "medio"  :
        score_globale >= 40 ? "alto"   : "critico";

    // Persisti il risultato
    const [score] = await db.insert(risk_scores).values({
        pratica_id: praticaId,
        score_globale,
        score_compliance_ce: crossCheckResult.score_ce,
        score_doganale:      crossCheckResult.score_doganale,
        score_coerenza:      crossCheckResult.score_coerenza,
        livello_rischio,
        dettaglio_penalita:  crossCheckResult.anomalie,
        raccomandazioni:     crossCheckResult.anomalie.map(a => a.raccomandazione),
        azioni_richieste:    buildAzioni(crossCheckResult.anomalie, praticaId),
        calcolato_by:        userId,
    }).returning();

    await db.insert(audit_log).values({
        organization_id: orgId,
        pratica_id:      praticaId,
        user_id:         userId,
        azione:          trigger === "auto_upload" ? "RISK_SCORE_AUTO_CALCOLATO" : "RISK_SCORE_CALCOLATO",
        entita_tipo:     "risk_score",
        entita_id:       score.id,
        dati_nuovi:      { score_globale, livello_rischio, trigger },
    });

    return {
        id:               score.id,
        pratica_id:       praticaId,
        score_globale,
        livello_rischio,
        score_compliance_ce: crossCheckResult.score_ce,
        score_doganale:      crossCheckResult.score_doganale,
        score_coerenza:      crossCheckResult.score_coerenza,
        anomalie:            crossCheckResult.anomalie,
    };
}
