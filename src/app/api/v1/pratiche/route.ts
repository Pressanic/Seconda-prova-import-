import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pratiche, macchinari, audit_log } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
    nome_pratica: z.string().min(3),
    fornitore_cinese: z.string().optional(),
    data_prevista_arrivo: z.string().optional(),
    note: z.string().optional(),
    macchinario: z.object({
        nome_macchina: z.string().min(3),
        modello: z.string().min(2),
        anno_produzione: z.coerce.number(),
        numero_seriale: z.string(),
        stato_macchina: z.enum(["nuova", "usata"]),
        potenza_kw: z.coerce.number().optional(),
        ha_sistemi_idraulici: z.boolean().default(false),
        ha_sistemi_pneumatici: z.boolean().default(false),
        ha_automazioni_robot: z.boolean().default(false),
        paese_destinazione: z.string().default("IT"),
        descrizione_tecnica: z.string(),
        funzione_principale: z.string(),
        tipologia_lavorazione: z.string().optional(),
    }).optional(),
});

// Generate codice pratica
async function generateCodice(org_id: string): Promise<string> {
    const year = new Date().getFullYear();
    const [count] = await db
        .select({ c: db.$count(pratiche, eq(pratiche.organization_id, org_id)) })
        .from(pratiche)
        .where(eq(pratiche.organization_id, org_id));
    const n = (Number(count?.c ?? 0) + 1).toString().padStart(4, "0");
    return `IMP-${year}-${n}`;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;

    const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
    const offset = (page - 1) * limit;

    const lista = await db
        .select()
        .from(pratiche)
        .where(eq(pratiche.organization_id, org_id))
        .limit(limit)
        .offset(offset);

    return NextResponse.json({ data: lista, page, limit });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;
    const user_id = (session.user as any).id;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
    }

    const { macchinario: macchinarioData, ...praticaData } = parsed.data;
    const codice = await generateCodice(org_id);

    const [newPratica] = await db
        .insert(pratiche)
        .values({
            organization_id: org_id,
            codice_pratica: codice,
            nome_pratica: praticaData.nome_pratica,
            fornitore_cinese: praticaData.fornitore_cinese,
            data_prevista_arrivo: praticaData.data_prevista_arrivo,
            note: praticaData.note,
            stato: "bozza",
            created_by: user_id,
        })
        .returning();

    // Create macchinario if provided
    if (macchinarioData && newPratica) {
        await db.insert(macchinari).values({
            pratica_id: newPratica.id,
            ...macchinarioData,
            potenza_kw: macchinarioData.potenza_kw?.toString(),
        });
    }

    // Audit log
    if (newPratica) {
        await db.insert(audit_log).values({
            organization_id: org_id,
            pratica_id: newPratica.id,
            user_id,
            azione: "PRATICA_CREATA",
            entita_tipo: "pratica",
            entita_id: newPratica.id,
            dati_nuovi: { codice_pratica: codice, nome_pratica: praticaData.nome_pratica },
        });
    }

    return NextResponse.json(newPratica, { status: 201 });
}
