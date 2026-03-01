/**
 * normative-eurlex.ts
 * Interroga EUR-Lex SPARQL per verificare lo stato in vigore di direttive/regolamenti UE.
 *
 * Endpoint ufficiale gratuito: https://publications.europa.eu/webapi/rdf/sparql
 * Ontologia CDM (Common Data Model): http://publications.europa.eu/ontology/cdm#
 *
 * Usato da:
 * - GET /api/v1/normative/check-eurlex  (trigger manuale dalla UI impostazioni/normative)
 * - GET /api/cron/check-normative       (trigger automatico settimanale Vercel Cron)
 */

const EURLEX_SPARQL = "https://publications.europa.eu/webapi/rdf/sparql";
const TIMEOUT_MS = 10_000;

export interface EurLexCheckResult {
    celex: string;
    id?: string;
    codice?: string;
    in_force: boolean | null;          // null = EUR-Lex non ha risposto
    date_end_of_validity: string | null;
    date_document?: string | null;     // data di pubblicazione
    error?: string;
}

/**
 * Interroga EUR-Lex SPARQL per un singolo CELEX.
 * Restituisce data di fine validità e flag in_force derivato.
 *
 * Logica in_force:
 *   - nessun dateEndValidity → ancora in vigore (true)
 *   - dateEndValidity < oggi → scaduto (false)
 *   - dateEndValidity >= oggi → in vigore, scadrà in futuro (true)
 */
export async function checkEurlexCelex(celex: string): Promise<EurLexCheckResult> {
    const query = `
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?dateDoc ?dateEndValidity
WHERE {
  ?work cdm:resource_legal_id_celex "${celex}" ;
        cdm:work_date_document ?dateDoc .
  OPTIONAL { ?work cdm:resource_legal_date_end_of_validity ?dateEndValidity }
}
LIMIT 1
    `.trim();

    const url = `${EURLEX_SPARQL}?query=${encodeURIComponent(query)}&format=application%2Fsparql-results%2Bjson`;

    try {
        const res = await fetch(url, {
            headers: { Accept: "application/sparql-results+json" },
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (!res.ok) {
            return { celex, in_force: null, date_end_of_validity: null, error: `HTTP ${res.status}` };
        }

        const data = await res.json();
        const bindings = (data?.results?.bindings ?? []) as Record<string, { value: string }>[];

        if (bindings.length === 0) {
            // Documento non trovato su EUR-Lex (CELEX errato o non indicizzato)
            return { celex, in_force: null, date_end_of_validity: null, error: "Documento non trovato su EUR-Lex" };
        }

        const dateEndValidity = bindings[0]?.dateEndValidity?.value ?? null;
        const dateDoc = bindings[0]?.dateDoc?.value ?? null;

        const in_force = dateEndValidity
            ? new Date(dateEndValidity) > new Date()
            : true;

        return { celex, in_force, date_end_of_validity: dateEndValidity, date_document: dateDoc };

    } catch (err: any) {
        const msg = err?.name === "TimeoutError"
            ? "Timeout EUR-Lex (>10s)"
            : (err?.message ?? "Errore connessione EUR-Lex");
        return { celex, in_force: null, date_end_of_validity: null, error: msg };
    }
}

/**
 * Interroga EUR-Lex per tutti i CELEX forniti in parallelo.
 */
export async function checkAllEurlexCelex(
    norms: Array<{ celex: string; id?: string; codice?: string }>
): Promise<EurLexCheckResult[]> {
    return Promise.all(
        norms.map(async n => {
            const result = await checkEurlexCelex(n.celex);
            return { ...result, id: n.id, codice: n.codice };
        })
    );
}
