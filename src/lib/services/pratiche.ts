import { db } from "@/lib/db";
import { pratiche, macchinari, documenti_ce, documenti_doganali, risk_scores } from "@/lib/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";

export async function getOrgStats(organization_id: string) {
    // Pratiche attive
    const pratiche_attive = await db
        .select({ count: count() })
        .from(pratiche)
        .where(and(
            eq(pratiche.organization_id, organization_id),
            sql`${pratiche.stato} != 'bloccata'`
        ));

    // Pratiche bloccate (rischio alto/critico)
    const pratiche_a_rischio = await db
        .select({ count: count() })
        .from(risk_scores)
        .innerJoin(pratiche, eq(risk_scores.pratica_id, pratiche.id))
        .where(and(
            eq(pratiche.organization_id, organization_id),
            sql`${risk_scores.livello_rischio} IN ('alto', 'critico')`
        ));

    // Score medio
    const score_medio = await db
        .select({ avg: sql<number>`COALESCE(AVG(${risk_scores.score_globale}), 0)` })
        .from(risk_scores)
        .innerJoin(pratiche, eq(risk_scores.pratica_id, pratiche.id))
        .where(eq(pratiche.organization_id, organization_id));

    // Lista pratiche recenti con risk score
    const lista = await db
        .select({
            id: pratiche.id,
            codice_pratica: pratiche.codice_pratica,
            nome_pratica: pratiche.nome_pratica,
            fornitore_cinese: pratiche.fornitore_cinese,
            stato: pratiche.stato,
            data_prevista_arrivo: pratiche.data_prevista_arrivo,
            created_at: pratiche.created_at,
            score_globale: risk_scores.score_globale,
            livello_rischio: risk_scores.livello_rischio,
        })
        .from(pratiche)
        .leftJoin(risk_scores, eq(risk_scores.pratica_id, pratiche.id))
        .where(eq(pratiche.organization_id, organization_id))
        .orderBy(desc(pratiche.created_at))
        .limit(20);

    return {
        pratiche_attive: pratiche_attive[0]?.count ?? 0,
        pratiche_a_rischio: pratiche_a_rischio[0]?.count ?? 0,
        score_medio: Math.round(Number(score_medio[0]?.avg ?? 0)),
        lista,
    };
}

export async function getAllPratiche(organization_id: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const lista = await db
        .select({
            id: pratiche.id,
            codice_pratica: pratiche.codice_pratica,
            nome_pratica: pratiche.nome_pratica,
            fornitore_cinese: pratiche.fornitore_cinese,
            stato: pratiche.stato,
            data_prevista_arrivo: pratiche.data_prevista_arrivo,
            created_at: pratiche.created_at,
            score_globale: risk_scores.score_globale,
            livello_rischio: risk_scores.livello_rischio,
        })
        .from(pratiche)
        .leftJoin(risk_scores, eq(risk_scores.pratica_id, pratiche.id))
        .where(eq(pratiche.organization_id, organization_id))
        .orderBy(desc(pratiche.created_at))
        .limit(limit)
        .offset(offset);

    const [total] = await db.select({ count: count() }).from(pratiche).where(eq(pratiche.organization_id, organization_id));
    return { lista, total: total?.count ?? 0 };
}

export async function getPraticaById(id: string, organization_id: string) {
    const [pratica] = await db
        .select()
        .from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, organization_id)))
        .limit(1);
    if (!pratica) return null;

    const [macchinario] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);
    const docsCE = macchinario
        ? await db.select().from(documenti_ce).where(eq(documenti_ce.macchinario_id, macchinario.id))
        : [];
    const docsDoganali = await db.select().from(documenti_doganali).where(eq(documenti_doganali.pratica_id, id));
    const [riskScore] = await db
        .select().from(risk_scores)
        .where(eq(risk_scores.pratica_id, id))
        .orderBy(desc(risk_scores.calcolato_at))
        .limit(1);

    return { ...pratica, macchinario, documenti_ce: docsCE, documenti_doganali: docsDoganali, risk_score: riskScore };
}
