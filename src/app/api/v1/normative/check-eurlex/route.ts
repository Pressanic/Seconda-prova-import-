export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { NORMATIVE } from "@/lib/normative-config";
import { checkAllEurlexCelex } from "@/lib/services/normative-eurlex";

/**
 * GET /api/v1/normative/check-eurlex
 *
 * Interroga EUR-Lex SPARQL per tutte le normative con verifica_metodo "eurlex_sparql".
 * Chiamato dalla UI impostazioni/normative tramite il pulsante "Verifica EUR-Lex".
 *
 * Response: { risultati: EurLexCheckResult[] }
 */
export async function GET(_req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const eurlexNorms = Object.values(NORMATIVE)
        .filter(n => n.verifica_metodo === "eurlex_sparql" && n.celex)
        .map(n => ({ celex: n.celex!, id: n.id, codice: n.codice }));

    const risultati = await checkAllEurlexCelex(eurlexNorms);

    return NextResponse.json({ risultati });
}
