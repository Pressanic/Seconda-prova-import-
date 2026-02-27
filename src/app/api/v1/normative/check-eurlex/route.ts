export const dynamic = "force-dynamic";
/**
 * API route: verifica automatica stato normativa via EUR-Lex SPARQL
 *
 * Usa il SPARQL endpoint pubblico di Publications Office EU:
 *   https://publications.europa.eu/webapi/rdf/sparql
 *
 * La CDM ontology (http://publications.europa.eu/ontology/cdm#) espone:
 *   cdm:resource_legal_is_in_force     → boolean
 *   cdm:resource_legal_date_end_of_validity → xsd:date
 *
 * Identificatore URI: http://publications.europa.eu/resource/celex/{celex}
 *
 * Autenticazione: nessuna. Rate limit: nessuno documentato.
 * Fonte: https://eur-lex.europa.eu/content/help/data-reuse/webservice.html
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { NORMATIVE, type NormativaRef } from "@/lib/normative-config";

const SPARQL_ENDPOINT = "https://publications.europa.eu/webapi/rdf/sparql";
const CDM = "http://publications.europa.eu/ontology/cdm#";

interface EurLexResult {
    celex: string;
    in_force: boolean | null;
    date_end_of_validity: string | null;
    error?: string;
    raw_response?: unknown;
}

async function checkCELEX(celex: string): Promise<EurLexResult> {
    const uri = `http://publications.europa.eu/resource/celex/${celex}`;

    const sparql = `
PREFIX cdm: <${CDM}>
SELECT ?inForce ?dateEnd WHERE {
  OPTIONAL { <${uri}> cdm:resource_legal_is_in_force ?inForce }
  OPTIONAL { <${uri}> cdm:resource_legal_date_end_of_validity ?dateEnd }
}
LIMIT 1`.trim();

    const url = new URL(SPARQL_ENDPOINT);
    url.searchParams.set("format", "application/sparql-results+json");
    url.searchParams.set("timeout", "10000");
    url.searchParams.set("query", sparql);

    const res = await fetch(url.toString(), {
        headers: { "Accept": "application/sparql-results+json" },
        signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
        return { celex, in_force: null, date_end_of_validity: null, error: `SPARQL HTTP ${res.status}` };
    }

    const json = await res.json();
    const bindings = json?.results?.bindings ?? [];

    if (bindings.length === 0) {
        return { celex, in_force: null, date_end_of_validity: null, error: "Nessun risultato — CELEX non trovato nel triplestore" };
    }

    const b = bindings[0];
    const inForce = b.inForce?.value === "true" ? true : b.inForce?.value === "false" ? false : null;
    const dateEnd = b.dateEnd?.value ?? null;

    return { celex, in_force: inForce, date_end_of_validity: dateEnd, raw_response: json };
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { celex } = body as { celex?: string };

    if (!celex) return NextResponse.json({ error: "Campo 'celex' obbligatorio" }, { status: 400 });

    try {
        const result = await checkCELEX(celex);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ celex, in_force: null, date_end_of_validity: null, error: e.message }, { status: 200 });
    }
}

/**
 * GET /api/v1/normative/check-eurlex
 * Verifica TUTTE le normative con verifica_metodo = "eurlex_sparql"
 */
export async function GET(_req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const eurlexNorms = Object.values(NORMATIVE).filter(
        (n): n is NormativaRef => n.verifica_metodo === "eurlex_sparql" && !!n.celex
    );

    const results = await Promise.allSettled(
        eurlexNorms.map(async (norm) => {
            const check = await checkCELEX(norm.celex!);
            return { id: norm.id, codice: norm.codice, ...check };
        })
    );

    const output = results.map((r, i) => {
        if (r.status === "fulfilled") return r.value;
        return { id: eurlexNorms[i].id, codice: eurlexNorms[i].codice, error: String(r.reason) };
    });

    return NextResponse.json({ verificato_il: new Date().toISOString(), risultati: output });
}
