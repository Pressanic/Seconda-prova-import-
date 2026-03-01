/**
 * document-agent.ts
 * Agente Claude con tool use per l'analisi contestuale dei documenti.
 *
 * Differenze rispetto al prompt singolo di extract-document/route.ts:
 * - Usa claude-sonnet-4-6 invece di claude-haiku (ragionamento migliore)
 * - Ha accesso ai dati della pratica tramite tool use (macchinario, componenti, altri documenti)
 * - Può cross-referenziare tra documenti diversi nella stessa pratica
 * - Genera anomalie contestuali (es. seriale diverso dal macchinario registrato)
 * - Popola componenti_trovati per fattura/packing_list in base agli articoli estratti
 */

import Anthropic from "@anthropic-ai/sdk";
import { NORMATIVE, getNormativaVigenteMacchine } from "@/lib/normative-config";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface PraticaContext {
    pratica: {
        id: string;
        incoterms: string | null;
        eori_importatore: string | null;
        fornitore_cinese: string | null;
    };
    macchinario: {
        marca: string | null;
        modello: string | null;
        numero_seriale: string | null;
        anno_produzione: number | null;
        peso_lordo_kg: number | null;
        peso_netto_kg: number | null;
        numero_colli_macchina: number | null;
        stato_macchina: string;
        tipo_azionamento: string | null;
    } | null;
    componenti: Array<{
        id: string;
        descrizione: string;
        numero_seriale: string | null;
        ha_marcatura_ce: boolean;
        peso_kg: number | null;
        valore_commerciale: number | null;
    }>;
    documenti_presenti: Record<string, {
        tipo: string;
        norme_armonizzate?: string[];
        normativa_citata?: string | null;
        numero_seriale_estratto?: string | null;
        data_documento?: string | null;
    }>;
}

export interface AgentAnalysisResult {
    campi_estratti: Record<string, any>;
    /** Indica se l'agente ha usato il contesto della pratica per arricchire l'analisi */
    contesto_usato: boolean;
    /** Turni dell'agente (per debugging) */
    turni: number;
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
    {
        name: "get_pratica_context",
        description:
            "Recupera il contesto completo della pratica: dati macchinario, componenti aggiuntivi e sommario " +
            "dei documenti già caricati. Usalo per cross-referenziare i dati del documento in analisi " +
            "(es. verificare che il numero seriale coincida, che il peso sia coerente, che le norme citate siano le stesse).",
        input_schema: {
            type: "object" as const,
            properties: {},
            required: [],
        },
    },
    {
        name: "verifica_norma",
        description:
            "Verifica se una norma/direttiva è attualmente vigente e restituisce informazioni su di essa. " +
            "Usa questo tool quando hai dubbi sulla validità di una norma citata nel documento.",
        input_schema: {
            type: "object" as const,
            properties: {
                codice_norma: {
                    type: "string",
                    description: "Codice della norma da verificare (es. 'Dir. 2006/42/CE', 'EN ISO 20430', 'ISO 12100:2010')",
                },
            },
            required: ["codice_norma"],
        },
    },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

function handleGetPraticaContext(context: PraticaContext): string {
    return JSON.stringify({
        macchinario: context.macchinario,
        componenti: context.componenti,
        documenti_presenti: context.documenti_presenti,
        pratica: {
            incoterms: context.pratica.incoterms,
            eori_importatore: context.pratica.eori_importatore,
            fornitore_cinese: context.pratica.fornitore_cinese,
        },
    }, null, 2);
}

function handleVerificaNorma(codiceNorma: string): string {
    const normalizzato = codiceNorma.toUpperCase().replace(/\s+/g, " ").trim();

    // Mappatura delle norme note
    const normeNote: Record<string, { vigente: boolean; descrizione: string; note?: string }> = {
        "DIR. 2006/42/CE": { vigente: true, descrizione: "Direttiva Macchine — vigente fino al 19/01/2027", note: "Obbligatoria per macchinari immessi sul mercato UE oggi" },
        "2006/42/CE": { vigente: true, descrizione: "Direttiva Macchine — vigente fino al 19/01/2027" },
        "2006/42/EC": { vigente: true, descrizione: "Direttiva Macchine (versione inglese) — vigente fino al 19/01/2027" },
        "REG. UE 2023/1230": { vigente: false, descrizione: "Regolamento Macchine — applicabile dal 20/01/2027", note: "Non ancora applicabile — se citato oggi è un errore" },
        "REG. (UE) 2023/1230": { vigente: false, descrizione: "Regolamento Macchine — applicabile dal 20/01/2027" },
        "DIR. 98/37/CE": { vigente: false, descrizione: "Vecchia Direttiva Macchine — abrogata dal 2009", note: "Abrogata, non accettabile" },
        "EN ISO 20430": { vigente: true, descrizione: NORMATIVE.EN_ISO_20430_2020.nome, note: "Norma specifica obbligatoria per presse ad iniezione plastica" },
        "EN ISO 20430:2020": { vigente: true, descrizione: NORMATIVE.EN_ISO_20430_2020.nome },
        "EN ISO 20430:2021": { vigente: true, descrizione: NORMATIVE.EN_ISO_20430_2020.nome },
        "ISO 12100:2010": { vigente: true, descrizione: NORMATIVE.ISO_12100_2010.nome, note: "Norma base per analisi dei rischi" },
        "ISO 12100": { vigente: true, descrizione: NORMATIVE.ISO_12100_2010.nome },
        "CEI EN 60204-1": { vigente: true, descrizione: NORMATIVE.CEI_EN_60204_1.nome, note: "Sicurezza macchine — Equipaggiamento elettrico" },
        "EN 60204-1": { vigente: true, descrizione: NORMATIVE.CEI_EN_60204_1.nome },
        "EN ISO 4413": { vigente: true, descrizione: NORMATIVE.EN_ISO_4413_2011.nome },
        "EN ISO 4413:2011": { vigente: true, descrizione: NORMATIVE.EN_ISO_4413_2011.nome },
        "EN ISO 4414": { vigente: true, descrizione: NORMATIVE.EN_ISO_4414_2011.nome },
        "EN ISO 4414:2011": { vigente: true, descrizione: NORMATIVE.EN_ISO_4414_2011.nome },
    };

    // Cerca corrispondenza (parte della stringa)
    for (const [key, val] of Object.entries(normeNote)) {
        if (normalizzato.includes(key) || key.includes(normalizzato.substring(0, 10))) {
            return JSON.stringify({ codice: codiceNorma, ...val });
        }
    }

    return JSON.stringify({
        codice: codiceNorma,
        vigente: null,
        descrizione: "Norma non presente nel registro locale — valutare manualmente",
        note: "Contatta il tuo esperto di conformità per verificare questa norma",
    });
}

// ─── Sistema prompt per l'agente ──────────────────────────────────────────────

function buildSystemPrompt(tipoDocumento: string): string {
    const normativa = getNormativaVigenteMacchine();
    const isDoganale = ["bill_of_lading", "fattura_commerciale", "packing_list", "certificato_origine", "insurance_certificate"].includes(tipoDocumento);

    return `Sei un esperto di conformità CE e documentazione doganale per l'importazione di macchinari industriali dalla Cina all'Italia/UE.

CONTESTO:
- Normativa macchine vigente: ${normativa.codice} (vigente fino al 19/01/2027)
- Norma specifica presse ad iniezione: EN ISO 20430:2020/2021
- Stai analizzando un documento di tipo: ${tipoDocumento}

HAI ACCESSO A DUE TOOL:
1. get_pratica_context — usa SEMPRE questo tool come primo passo per ottenere il contesto della pratica (macchinario registrato, componenti, altri documenti già caricati). Ti permetterà di fare cross-referenze accurate.
2. verifica_norma — usa questo tool quando trovi norme nel documento e vuoi verificare se sono vigenti.

PROCESSO DI ANALISI:
1. Prima chiama get_pratica_context per conoscere il contesto
2. Analizza il documento alla luce del contesto
3. Usa verifica_norma se necessario
4. Restituisci il JSON finale con i dati estratti e le anomalie trovate

CROSS-REFERENCE DA EFFETTUARE (in base al tipo documento):
${isDoganale ? `
- bill_of_lading/packing_list: confronta peso con macchinario.peso_lordo_kg + Σ componenti.peso_kg. Confronta numero colli.
- fattura_commerciale: per ogni articolo in articoli_fattura, verifica se corrisponde a un componente registrato (per numero seriale o descrizione). Popola componenti_trovati.
- packing_list: analogo alla fattura per articoli_packing. Popola componenti_trovati.
- Confronta incoterms del documento con pratica.incoterms. Se diversi, segnala anomalia.
` : `
- dichiarazione_ce: confronta numero_seriale con macchinario.numero_seriale. Se diversi, anomalia CRITICA. Confronta marca/modello.
- dichiarazione_ce: verifica che norme_armonizzate includa EN ISO 20430. Se manca, anomalia ALTA.
- fascicolo_tecnico: verifica coerenza norme_armonizzate con la dichiarazione_ce già caricata.
- Per ogni norma citata usa verifica_norma per confermare validità.
`}

FORMATO RISPOSTA FINALE:
Restituisci SOLO il JSON strutturato per il tipo di documento ${tipoDocumento}, con il campo "anomalie" che contiene le anomalie trovate (incluse quelle da cross-reference con il contesto).
Non aggiungere spiegazioni fuori dal JSON.`;
}

// ─── Core agent loop ──────────────────────────────────────────────────────────

export async function runDocumentAgent(params: {
    fileBase64: string;
    mimeType: string;
    tipoDocumento: string;
    extractionPrompt: string;
    context: PraticaContext;
}): Promise<AgentAnalysisResult> {
    const { fileBase64, mimeType, tipoDocumento, extractionPrompt, context } = params;

    const isPdf = mimeType === "application/pdf";
    const mediaType = isPdf ? "application/pdf" as const : (mimeType as "image/jpeg" | "image/png" | "image/webp");

    const documentBlock = isPdf
        ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: fileBase64 } }
        : { type: "image" as const, source: { type: "base64" as const, media_type: mediaType as "image/jpeg" | "image/png" | "image/webp", data: fileBase64 } };

    const userMessage: Anthropic.MessageParam = {
        role: "user",
        content: [
            documentBlock as any,
            {
                type: "text",
                text: `Analizza questo documento. Segui il tuo processo: prima chiama get_pratica_context, poi analizza con cross-reference, poi verifica le norme se necessario.\n\nIstruzioni specifiche per l'estrazione:\n${extractionPrompt}`,
            },
        ],
    };

    const messages: Anthropic.MessageParam[] = [userMessage];
    const MAX_TURNS = 6;
    let turni = 0;
    let contesto_usato = false;

    while (turni < MAX_TURNS) {
        turni++;

        const createParams: any = {
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            system: buildSystemPrompt(tipoDocumento),
            tools: TOOLS,
            messages,
        };

        // PDF beta support
        if (isPdf) createParams.betas = ["pdfs-2024-09-25"];

        const response: Anthropic.Message = isPdf
            ? await (client.beta.messages.create as any)(createParams)
            : await client.messages.create(createParams);

        // Collect tool uses from this response
        const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

        if (response.stop_reason === "end_turn" || toolUses.length === 0) {
            // Final response — extract JSON
            const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
            const rawText = textBlock?.text?.trim() ?? "{}";

            let campi_estratti: Record<string, any> = {};
            try {
                const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                campi_estratti = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
            } catch {
                campi_estratti = {};
            }

            // Clean nulls/empty
            for (const k of Object.keys(campi_estratti)) {
                if (campi_estratti[k] === null || campi_estratti[k] === undefined || campi_estratti[k] === "") {
                    delete campi_estratti[k];
                }
            }

            return { campi_estratti, contesto_usato, turni };
        }

        // Add assistant response to messages
        messages.push({ role: "assistant", content: response.content });

        // Execute tools and build tool_result message
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUses) {
            let result: string;

            if (toolUse.name === "get_pratica_context") {
                result = handleGetPraticaContext(context);
                contesto_usato = true;
            } else if (toolUse.name === "verifica_norma") {
                const input = toolUse.input as { codice_norma: string };
                result = handleVerificaNorma(input.codice_norma ?? "");
            } else {
                result = JSON.stringify({ error: `Tool '${toolUse.name}' non riconosciuto` });
            }

            toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: result,
            });
        }

        messages.push({ role: "user", content: toolResults });
    }

    // Max turns reached — return empty
    return { campi_estratti: {}, contesto_usato, turni };
}
