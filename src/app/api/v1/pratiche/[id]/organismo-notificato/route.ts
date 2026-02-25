export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, macchinari, organismi_notificati } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// ─── Simulated NANDO local DB ─────────────────────────────────────────────────
// Real NANDO numbers are assigned by the European Commission for notified bodies
// authorized under specific EU directives (Machinery: 2006/42/EC / 2023/1230)
const NANDO_DB: Record<string, {
    nome: string;
    paese: string;
    ambiti: string[];
    attivo: boolean;
}> = {
    "0062": { nome: "TÜV SÜD Product Service GmbH", paese: "DE", ambiti: ["machinery", "pressure", "atex"], attivo: true },
    "0044": { nome: "TÜV Rheinland LGA Products GmbH", paese: "DE", ambiti: ["machinery", "electrical", "atex"], attivo: true },
    "0035": { nome: "Bureau Veritas Consumer Products Services Germany GmbH", paese: "DE", ambiti: ["machinery", "ppe"], attivo: true },
    "0068": { nome: "Dekra Certification B.V.", paese: "NL", ambiti: ["machinery", "pressure"], attivo: true },
    "0086": { nome: "SGS Belgium NV", paese: "BE", ambiti: ["machinery", "electrical"], attivo: true },
    "0123": { nome: "Intertek Testing & Certification Ltd", paese: "GB", ambiti: ["machinery"], attivo: false }, // Post-Brexit - non più UE
    "0333": { nome: "IMQ - Istituto Italiano del Marchio di Qualità", paese: "IT", ambiti: ["electrical", "machinery"], attivo: true },
    "0474": { nome: "CPA - Centro Produzione Audiovisivi", paese: "IT", ambiti: ["electrical"], attivo: true },
    "0051": { nome: "LCIE Bureau Veritas", paese: "FR", ambiti: ["machinery", "electrical", "atex"], attivo: true },
    "0081": { nome: "APAVE INTERNATIONAL", paese: "FR", ambiti: ["machinery", "pressure"], attivo: true },
    "1023": { nome: "RINA Services S.p.A.", paese: "IT", ambiti: ["machinery", "marine", "pressure"], attivo: true },
    "1282": { nome: "CSI - Centro Sperimentale dell'Imballaggio", paese: "IT", ambiti: ["packaging"], attivo: true },
    "0543": { nome: "DNV GL", paese: "NO", ambiti: ["pressure", "marine"], attivo: true },
    "0197": { nome: "UL International DEMKO A/S", paese: "DK", ambiti: ["electrical", "machinery"], attivo: true },
    "2937": { nome: "Element Materials Technology Hitchin Ltd", paese: "GB", ambiti: ["machinery"], attivo: false }, // Post-Brexit
};

// ─── GET - fetch existing NB for this pratica ─────────────────────────────────
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any)?.organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [macch] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);
    if (!macch) return NextResponse.json({ organismi: [] });

    const organismi = await db.select().from(organismi_notificati)
        .where(eq(organismi_notificati.macchinario_id, macch.id));

    return NextResponse.json({ organismi });
}

// ─── POST - verify & save notified body ───────────────────────────────────────
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any)?.organization_id;
    const { id } = await params;

    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [macch] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);
    if (!macch) return NextResponse.json({ error: "Macchinario non trovato. Aggiungi prima i dati del macchinario." }, { status: 400 });

    const body = await request.json();
    const { numero_organismo } = body as { numero_organismo: string };

    if (!numero_organismo?.trim()) {
        return NextResponse.json({ error: "Numero organismo obbligatorio" }, { status: 400 });
    }

    const normalized = numero_organismo.trim().replace(/^0+/, "").padStart(4, "0");

    // Simulate NANDO lookup
    const nandoEntry = NANDO_DB[normalized];
    let stato_verifica: string;
    let nando_response: Record<string, any>;

    if (!nandoEntry) {
        stato_verifica = "non_trovato";
        nando_response = {
            found: false,
            message: `Nessun organismo notificato con numero ${normalized} trovato nel registro NANDO-EU`,
            queried_at: new Date().toISOString(),
        };
    } else if (!nandoEntry.attivo) {
        stato_verifica = "non_autorizzato";
        nando_response = {
            found: true,
            active: false,
            nome: nandoEntry.nome,
            paese: nandoEntry.paese,
            message: "Organismo non più autorizzato nell'UE (es. post-Brexit)",
            queried_at: new Date().toISOString(),
        };
    } else if (!nandoEntry.ambiti.includes("machinery")) {
        stato_verifica = "non_autorizzato";
        nando_response = {
            found: true,
            active: true,
            nome: nandoEntry.nome,
            paese: nandoEntry.paese,
            ambiti: nandoEntry.ambiti,
            message: "Organismo non autorizzato per la Direttiva Macchine (2006/42/CE / Reg. UE 2023/1230)",
            queried_at: new Date().toISOString(),
        };
    } else {
        stato_verifica = "valido";
        nando_response = {
            found: true,
            active: true,
            nome: nandoEntry.nome,
            paese: nandoEntry.paese,
            ambiti: nandoEntry.ambiti,
            message: "Organismo notificato valido per Reg. UE 2023/1230 (ex Dir. Macchine)",
            queried_at: new Date().toISOString(),
        };
    }

    // Upsert: delete existing and insert new
    await db.delete(organismi_notificati).where(eq(organismi_notificati.macchinario_id, macch.id));

    const [organismo] = await db.insert(organismi_notificati).values({
        macchinario_id: macch.id,
        numero_organismo: normalized,
        nome_organismo: nandoEntry?.nome ?? null,
        stato_verifica,
        ambito_autorizzazione: nandoEntry?.ambiti?.join(", ") ?? null,
        nando_response,
    }).returning();

    return NextResponse.json({ organismo, stato_verifica, nando_response });
}
