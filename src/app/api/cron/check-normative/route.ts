import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit_log } from "@/lib/db/schema";
import { NORMATIVE, isNormativaScadenzaImminente } from "@/lib/normative-config";
import { checkAllEurlexCelex, type EurLexCheckResult } from "@/lib/services/normative-eurlex";

/**
 * GET /api/cron/check-normative
 *
 * Endpoint Vercel Cron — esecuzione settimanale (ogni lunedì alle 08:00 UTC).
 * Protetto da CRON_SECRET (Vercel lo invia automaticamente come Bearer token).
 *
 * Cosa fa:
 * 1. Interroga EUR-Lex SPARQL per tutte le normative EU verificabili
 * 2. Confronta con i dati attesi nel registro normative-config.ts
 * 3. Salva il risultato nell'audit_log (azione: NORMATIVA_CHECK_AUTO)
 * 4. Se rileva anomalie (normativa scaduta o cambiata), salva anche un evento NORMATIVA_ANOMALIA
 */
export async function GET(req: NextRequest) {
    // Verifica CRON_SECRET
    const authHeader = req.headers.get("Authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eurlexNorms = Object.values(NORMATIVE)
        .filter(n => n.verifica_metodo === "eurlex_sparql" && n.celex)
        .map(n => ({ celex: n.celex!, id: n.id, codice: n.codice }));

    const risultati = await checkAllEurlexCelex(eurlexNorms);

    // Analisi anomalie
    const anomalie: Array<{ celex: string; codice: string; tipo: string; dettaglio: string }> = [];

    for (const r of risultati) {
        const norm = Object.values(NORMATIVE).find(n => n.celex === r.celex);
        if (!norm) continue;

        if (r.error) {
            anomalie.push({ celex: r.celex, codice: r.codice ?? r.celex, tipo: "ERRORE_EURLEX", dettaglio: r.error });
            continue;
        }

        // Normativa risulta non in vigore mentre il registro dice che lo è
        if (r.in_force === false && norm.status === "in_vigore") {
            anomalie.push({
                celex: r.celex,
                codice: r.codice ?? r.celex,
                tipo: "NORMATIVA_SCADUTA_INASPETTATA",
                dettaglio: `EUR-Lex riporta fine validità ${r.date_end_of_validity} ma il registro la indica come in_vigore`,
            });
        }

        // Data di fine validità diversa da quella attesa nel registro
        if (r.date_end_of_validity && norm.in_vigore_al && r.date_end_of_validity !== norm.in_vigore_al) {
            anomalie.push({
                celex: r.celex,
                codice: r.codice ?? r.celex,
                tipo: "DATA_SCADENZA_DIVERSA",
                dettaglio: `EUR-Lex: ${r.date_end_of_validity} | Registro: ${norm.in_vigore_al}`,
            });
        }

        // Scadenza imminente (entro 365 giorni)
        if (isNormativaScadenzaImminente(norm, 365) && !anomalie.find(a => a.celex === r.celex)) {
            anomalie.push({
                celex: r.celex,
                codice: r.codice ?? r.celex,
                tipo: "SCADENZA_IMMINENTE",
                dettaglio: `La normativa scade il ${norm.in_vigore_al}${norm.successore_id ? ` — successore: ${norm.successore_id}` : ""}`,
            });
        }
    }

    // Salva il risultato dell'esecuzione cron
    await db.insert(audit_log).values({
        organization_id: null,
        pratica_id: null,
        user_id: null,
        azione: "NORMATIVA_CHECK_AUTO",
        entita_tipo: "sistema",
        entita_id: null,
        dati_nuovi: {
            risultati: risultati.map(r => ({
                celex: r.celex,
                codice: r.codice,
                in_force: r.in_force,
                date_end_of_validity: r.date_end_of_validity,
                error: r.error ?? null,
            })),
            anomalie,
            eseguito_il: new Date().toISOString(),
        },
    });

    // Salva evento separato per ogni anomalia critica
    for (const anomalia of anomalie.filter(a => a.tipo !== "SCADENZA_IMMINENTE")) {
        await db.insert(audit_log).values({
            organization_id: null,
            pratica_id: null,
            user_id: null,
            azione: "NORMATIVA_ANOMALIA",
            entita_tipo: "normativa",
            entita_id: null,
            dati_nuovi: anomalia,
        });
    }

    return NextResponse.json({
        ok: true,
        verificate: risultati.length,
        anomalie: anomalie.length,
        dettaglio: anomalie,
    });
}
