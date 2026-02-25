import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    pratiche, macchinari, documenti_ce, documenti_doganali,
    organismi_notificati, risk_scores, organizations
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ReportDocument } from "@/components/pdf/ReportDocument";
import { calcolaRiskScore } from "@/lib/services/risk-engine";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any)?.organization_id;
    const { id } = await params;

    // Fetch pratica
    const [pratica] = await db.select().from(pratiche)
        .where(and(eq(pratiche.id, id), eq(pratiche.organization_id, org_id))).limit(1);
    if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch organization name
    const [org] = await db.select().from(organizations).where(eq(organizations.id, org_id)).limit(1);

    // Fetch related data
    const [macch] = await db.select().from(macchinari).where(eq(macchinari.pratica_id, id)).limit(1);

    const docsCE = macch
        ? await db.select().from(documenti_ce).where(eq(documenti_ce.macchinario_id, macch.id))
        : [];

    const docsDoganali = await db.select().from(documenti_doganali)
        .where(eq(documenti_doganali.pratica_id, id));

    const [organismo] = macch
        ? await db.select().from(organismi_notificati)
            .where(eq(organismi_notificati.macchinario_id, macch.id)).limit(1)
        : [null];

    // Compute live risk score
    const liveScore = calcolaRiskScore({
        documenti_ce: docsCE.map(d => ({ ...d, stato_validazione: d.stato_validazione ?? "da_verificare" })),
        organismo: organismo ? { stato_verifica: organismo.stato_verifica ?? "non_verificato" } : null,
        documenti_doganali: docsDoganali.map(d => ({ ...d, stato_validazione: d.stato_validazione ?? "da_verificare" })),
        codice_hs_selezionato: macch?.codice_taric_selezionato,
    });

    const reportData = {
        pratica: {
            codice_pratica: pratica.codice_pratica,
            nome_pratica: pratica.nome_pratica,
            fornitore_cinese: pratica.fornitore_cinese,
            stato: pratica.stato,
            data_prevista_arrivo: pratica.data_prevista_arrivo,
        },
        macchinario: macch ? {
            nome_macchina: macch.nome_macchina,
            modello: macch.modello,
            anno_produzione: macch.anno_produzione,
            stato_macchina: macch.stato_macchina,
            codice_taric_selezionato: macch.codice_taric_selezionato,
        } : null,
        documenti_ce: docsCE.map(d => ({
            tipo_documento: d.tipo_documento,
            nome_file: d.nome_file,
            stato_validazione: d.stato_validazione,
        })),
        organismo: organismo ? {
            numero_organismo: organismo.numero_organismo,
            nome_organismo: organismo.nome_organismo,
            stato_verifica: organismo.stato_verifica,
        } : null,
        documenti_doganali: docsDoganali.map(d => ({
            tipo_documento: d.tipo_documento,
            nome_file: d.nome_file,
            stato_validazione: d.stato_validazione,
        })),
        riskScore: liveScore,
        generatedAt: new Date().toLocaleString("it-IT"),
        orgName: org?.nome ?? "—",
    };

    // Generate PDF buffer
    const buffer = await renderToBuffer(
        createElement(ReportDocument, { data: reportData })
    );

    const filename = `report-${pratica.codice_pratica.replace(/\//g, "-")}.pdf`;

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": buffer.byteLength.toString(),
        },
    });
}
