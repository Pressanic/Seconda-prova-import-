/**
 * Cross-check engine — logica server-side di validazione incrociata dei dati
 *
 * Contesto: presse ad iniezione plastica, importazione Cina → Italia/UE
 * Normativa: Dir. 2006/42/CE (attuale), Reg. UE 2023/1230 (dal 20/01/2027)
 * Norma specifica: EN ISO 20430:2021
 */

export interface CrossCheckAnomalia {
    codice: string;
    categoria: "ce" | "doganale" | "coerenza";
    severita: "critica" | "alta" | "media" | "bassa";
    messaggio: string;
    raccomandazione: string;
    penalita: number;
}

export interface CrossCheckResult {
    anomalie: CrossCheckAnomalia[];
    score_coerenza: number;    // 0–100
    score_ce: number;          // 0–100
    score_doganale: number;    // 0–100
    cap_score_globale: number; // 100 | 65 | 45 — limite massimo score globale per anomalie critiche
}

// ─── Tipi di input ────────────────────────────────────────────────────────────

export interface MacchinarioInput {
    nome_macchina: string;
    marca?: string | null;
    modello: string;
    numero_seriale?: string | null;
    anno_produzione?: number | null;
    stato_macchina: "nuova" | "usata";
    tipo_azionamento?: string | null; // idraulico | elettrico | ibrido
    potenza_kw?: number | null;
    peso_lordo_kg?: number | null;
    peso_netto_kg?: number | null;
    numero_colli_macchina?: number | null;
    robot_estrazione_integrato?: boolean;
    sistemi_pneumatici_ausiliari?: boolean;
}

export interface ComponenteInput {
    id: string;
    descrizione: string;
    numero_seriale?: string | null;
    peso_kg?: number | null;
    valore_commerciale?: number | null;
    ha_marcatura_ce: boolean;
}

export interface DocumentoCEInput {
    tipo_documento: string;
    stato_validazione?: string | null;
    norme_armonizzate?: string[];
    normativa_citata?: string | null;
    data_documento?: string | null;
    componente_id?: string | null;
    // campi estratti dall'AI usati per cross-check
    dati_estratti?: {
        numero_seriale?: string;
        modello?: string;
        marca?: string;
        anno_produzione?: number;
        tensione_v?: number;
        potenza_kw?: number;
    };
}

export interface DocumentoDoganaleInput {
    tipo_documento: string;
    stato_validazione?: string | null;
    peso_doc_kg?: number | null;
    valore_commerciale?: number | null;
    codice_hs_nel_doc?: string | null;
    incoterms_doc?: string | null;
    numero_colli_doc?: number | null;
    componenti_trovati?: Array<{
        componente_id: string;
        trovato: boolean;
        confermato_manualmente: boolean;
    }>;
}

export interface PraticaInput {
    eori_importatore?: string | null;
    incoterms?: string | null;
    porto_arrivo?: string | null;
    fornitore_cinese?: string | null;
    codice_taric_selezionato?: string | null;
}

// ─── Engine principale ────────────────────────────────────────────────────────

export function runCrossChecks(params: {
    pratica: PraticaInput;
    macchinario: MacchinarioInput | null;
    componenti: ComponenteInput[];
    documenti_ce: DocumentoCEInput[];
    documenti_doganali: DocumentoDoganaleInput[];
}): CrossCheckResult {
    const { pratica, macchinario, componenti, documenti_ce, documenti_doganali } = params;
    const anomalie: CrossCheckAnomalia[] = [];

    // ─── CHECK PRATICA ────────────────────────────────────────────────────────

    if (!pratica.eori_importatore?.trim()) {
        anomalie.push({
            codice: "PRATICA_EORI_MANCANTE",
            categoria: "doganale",
            severita: "critica",
            messaggio: "EORI importatore non inserito",
            raccomandazione: "Il numero EORI è obbligatorio per qualsiasi dichiarazione doganale UE. Inserirlo nei dati pratica.",
            penalita: 20,
        });
    }

    if (!pratica.incoterms?.trim()) {
        anomalie.push({
            codice: "PRATICA_INCOTERMS_MANCANTI",
            categoria: "doganale",
            severita: "media",
            messaggio: "Incoterms non specificati",
            raccomandazione: "Gli Incoterms determinano la base imponibile doganale (CIF vs FOB). Inserirli nei dati pratica.",
            penalita: 10,
        });
    }

    if (!macchinario) {
        // Senza macchinario non possiamo fare altri check
        return buildResult(anomalie, documenti_ce, documenti_doganali, componenti);
    }

    // ─── CHECK MACCHINARIO ────────────────────────────────────────────────────

    if (!macchinario.peso_lordo_kg) {
        anomalie.push({
            codice: "MACCH_PESO_MANCANTE",
            categoria: "doganale",
            severita: "alta",
            messaggio: "Peso lordo macchinario non inserito",
            raccomandazione: "Il peso lordo è obbligatorio per la dichiarazione doganale. Inserirlo nella scheda macchinario.",
            penalita: 15,
        });
    }

    if (!macchinario.numero_seriale?.trim()) {
        anomalie.push({
            codice: "MACCH_SERIALE_MANCANTE",
            categoria: "ce",
            severita: "alta",
            messaggio: "Numero di serie macchinario non inserito",
            raccomandazione: "Il numero di serie è necessario per il cross-check con la dichiarazione CE e i documenti doganali.",
            penalita: 10,
        });
    }

    // ─── CHECK CE — documenti obbligatori ─────────────────────────────────────

    const tipiCe = documenti_ce.map(d => d.tipo_documento);
    const DOCS_CE_OBBLIGATORI = ["dichiarazione_ce", "manuale_uso", "fascicolo_tecnico"];

    for (const tipo of DOCS_CE_OBBLIGATORI) {
        if (!tipiCe.includes(tipo)) {
            anomalie.push({
                codice: `CE_DOC_MANCANTE_${tipo.toUpperCase()}`,
                categoria: "ce",
                severita: tipo === "dichiarazione_ce" ? "critica" : "alta",
                messaggio: `Documento CE obbligatorio mancante: ${tipo.replace(/_/g, " ")}`,
                raccomandazione: `Caricare il documento "${tipo.replace(/_/g, " ")}" nella sezione Compliance CE.`,
                penalita: tipo === "dichiarazione_ce" ? 30 : 20,
            });
        }
    }

    // Schemi elettrici obbligatori (nel fascicolo o come doc separato)
    const hasSchemiFascicolo = documenti_ce.some(d =>
        d.tipo_documento === "fascicolo_tecnico" &&
        (d.dati_estratti as any)?.contiene_schemi_elettrici === true
    );
    const hasSchemiSeparati = tipiCe.includes("schemi_elettrici");
    if (!hasSchemiFascicolo && !hasSchemiSeparati) {
        anomalie.push({
            codice: "CE_SCHEMI_ELETTRICI_MANCANTI",
            categoria: "ce",
            severita: "alta",
            messaggio: "Schemi elettrici non trovati (né nel fascicolo né come documento separato)",
            raccomandazione: "Caricare gli schemi elettrici (CEI EN 60204-1) nel fascicolo tecnico o come documento separato.",
            penalita: 10,
        });
    }

    // Schemi idraulici se macchina è idraulica o ibrida
    if (macchinario.tipo_azionamento === "idraulico" || macchinario.tipo_azionamento === "ibrido") {
        const hasSchemiIdraulici = tipiCe.includes("schemi_idraulici") ||
            documenti_ce.some(d =>
                d.tipo_documento === "fascicolo_tecnico" &&
                (d.dati_estratti as any)?.contiene_schemi_idraulici === true
            );
        if (!hasSchemiIdraulici) {
            anomalie.push({
                codice: "CE_SCHEMI_IDRAULICI_MANCANTI",
                categoria: "ce",
                severita: "media",
                messaggio: "Schemi idraulici mancanti per macchina ad azionamento idraulico/ibrido",
                raccomandazione: "Caricare gli schemi del circuito idraulico nel fascicolo tecnico.",
                penalita: 10,
            });
        }
    }

    // Schemi pneumatici se sistemi pneumatici ausiliari presenti
    if (macchinario.sistemi_pneumatici_ausiliari) {
        const hasSchemiPneumatici = tipiCe.includes("schemi_pneumatici") ||
            documenti_ce.some(d =>
                d.tipo_documento === "fascicolo_tecnico" &&
                (d.dati_estratti as any)?.contiene_schemi_pneumatici === true
            );
        if (!hasSchemiPneumatici) {
            anomalie.push({
                codice: "CE_SCHEMI_PNEUMATICI_MANCANTI",
                categoria: "ce",
                severita: "bassa",
                messaggio: "Schemi pneumatici mancanti (sistemi pneumatici ausiliari dichiarati presenti)",
                raccomandazione: "Caricare gli schemi del circuito pneumatico nel fascicolo tecnico.",
                penalita: 5,
            });
        }
    }

    // ─── CHECK CE — norma EN ISO 20430 nella dichiarazione CE ─────────────────

    const dichCE = documenti_ce.find(d => d.tipo_documento === "dichiarazione_ce");
    if (dichCE && dichCE.norme_armonizzate && dichCE.norme_armonizzate.length > 0) {
        const cita20430 = dichCE.norme_armonizzate.some(n =>
            n.includes("20430") || n.includes("EN 201")
        );
        if (!cita20430) {
            anomalie.push({
                codice: "CE_NORMA_20430_MANCANTE",
                categoria: "ce",
                severita: "alta",
                messaggio: "EN ISO 20430:2021 non citata nella Dichiarazione CE",
                raccomandazione: "Per presse ad iniezione plastica la norma armonizzata specifica è EN ISO 20430:2021. Verificare che il fabbricante l'abbia applicata e citata nella dichiarazione.",
                penalita: 15,
            });
        }
    }

    // ─── CHECK CE — cross-check numero seriale dichiarazione vs macchinario ───

    if (dichCE && macchinario.numero_seriale && dichCE.dati_estratti?.numero_seriale) {
        if (dichCE.dati_estratti.numero_seriale !== macchinario.numero_seriale) {
            anomalie.push({
                codice: "CE_SERIALE_MISMATCH",
                categoria: "coerenza",
                severita: "critica",
                messaggio: `Numero di serie non corrisponde: dichiarazione CE riporta "${dichCE.dati_estratti.numero_seriale}", macchinario "${macchinario.numero_seriale}"`,
                raccomandazione: "Verificare che la Dichiarazione CE si riferisca alla macchina corretta. Il numero di serie deve coincidere esattamente.",
                penalita: 25,
            });
        }
    }

    // ─── CHECK CE — macchina usata ────────────────────────────────────────────

    if (macchinario.stato_macchina === "usata") {
        const hasAnalisiRischi = tipiCe.includes("analisi_rischi") ||
            documenti_ce.some(d =>
                d.tipo_documento === "fascicolo_tecnico" &&
                (d.dati_estratti as any)?.contiene_analisi_rischi === true
            );
        if (!hasAnalisiRischi) {
            anomalie.push({
                codice: "CE_USATA_SENZA_ANALISI_RISCHI",
                categoria: "ce",
                severita: "critica",
                messaggio: "Macchina usata senza analisi dei rischi aggiornata",
                raccomandazione: "Per macchinari usati è necessaria una nuova analisi dei rischi (ISO 12100:2010) redatta da un tecnico competente.",
                penalita: 25,
            });
        }
    }

    // ─── CHECK CE — componenti con marcatura CE obbligatoria ──────────────────

    for (const comp of componenti.filter(c => c.ha_marcatura_ce)) {
        const hasCEComp = documenti_ce.some(d => d.componente_id === comp.id);
        if (!hasCEComp) {
            anomalie.push({
                codice: `CE_COMP_DOC_MANCANTE_${comp.id.substring(0, 8).toUpperCase()}`,
                categoria: "ce",
                severita: "alta",
                messaggio: `Documentazione CE mancante per componente: "${comp.descrizione}"`,
                raccomandazione: `Caricare la Dichiarazione CE del componente "${comp.descrizione}" nella sezione Compliance CE.`,
                penalita: 10,
            });
        }
    }

    // ─── CHECK DOGANALE — documenti obbligatori ────────────────────────────────

    const tipiDog = documenti_doganali.map(d => d.tipo_documento);
    const DOCS_DOG_OBBLIGATORI = ["bill_of_lading", "fattura_commerciale", "packing_list"];

    for (const tipo of DOCS_DOG_OBBLIGATORI) {
        if (!tipiDog.includes(tipo)) {
            anomalie.push({
                codice: `DOG_DOC_MANCANTE_${tipo.toUpperCase()}`,
                categoria: "doganale",
                severita: "critica",
                messaggio: `Documento doganale obbligatorio mancante: ${tipo.replace(/_/g, " ")}`,
                raccomandazione: `Caricare il documento "${tipo.replace(/_/g, " ")}" nella sezione Documenti Doganali.`,
                penalita: 25,
            });
        }
    }

    // Insurance certificate obbligatorio se Incoterms = CIF
    if (pratica.incoterms === "CIF" && !tipiDog.includes("insurance_certificate")) {
        anomalie.push({
            codice: "DOG_INSURANCE_MANCANTE_CIF",
            categoria: "doganale",
            severita: "alta",
            messaggio: "Insurance Certificate mancante con Incoterms CIF",
            raccomandazione: "Con Incoterms CIF il venditore è responsabile dell'assicurazione. Caricare il certificato assicurativo.",
            penalita: 15,
        });
    }

    // ─── CHECK DOGANALE — cross-check peso BL vs macchinario ──────────────────

    const bl = documenti_doganali.find(d => d.tipo_documento === "bill_of_lading");
    if (bl?.peso_doc_kg && macchinario.peso_lordo_kg) {
        const pesoPrevisto = calcolaPesoTotale(macchinario, componenti);
        const diff = Math.abs(Number(bl.peso_doc_kg) - pesoPrevisto);
        const tolleranza = pesoPrevisto * 0.05; // 5%

        if (diff > tolleranza) {
            anomalie.push({
                codice: "DOG_PESO_BL_MISMATCH",
                categoria: "coerenza",
                severita: diff / pesoPrevisto > 0.15 ? "alta" : "media",
                messaggio: `Peso BL (${bl.peso_doc_kg} kg) non corrisponde al peso atteso (${pesoPrevisto.toFixed(0)} kg) — differenza: ${diff.toFixed(0)} kg (${(diff / pesoPrevisto * 100).toFixed(1)}%)`,
                raccomandazione: "Verificare con lo spedizioniere il peso riportato nel BL. Il peso atteso è calcolato dalla somma di macchinario + componenti dichiarati.",
                penalita: diff / pesoPrevisto > 0.15 ? 15 : 8,
            });
        }
    }

    // ─── CHECK DOGANALE — cross-check peso Packing List vs BL ────────────────

    const pl = documenti_doganali.find(d => d.tipo_documento === "packing_list");
    if (bl?.peso_doc_kg && pl?.peso_doc_kg) {
        const diffBLPL = Math.abs(Number(bl.peso_doc_kg) - Number(pl.peso_doc_kg));
        const tolleranzaBLPL = Number(bl.peso_doc_kg) * 0.05;
        if (diffBLPL > tolleranzaBLPL) {
            anomalie.push({
                codice: "DOG_PESO_BL_PL_MISMATCH",
                categoria: "coerenza",
                severita: "media",
                messaggio: `Peso BL (${bl.peso_doc_kg} kg) e Packing List (${pl.peso_doc_kg} kg) non coincidono — differenza: ${diffBLPL.toFixed(0)} kg`,
                raccomandazione: "Richiedere chiarimento allo spedizioniere: BL e Packing List devono riportare lo stesso peso lordo.",
                penalita: 10,
            });
        }
    }

    // ─── CHECK DOGANALE — cross-check HS code fattura vs classificazione ──────

    const fattura = documenti_doganali.find(d => d.tipo_documento === "fattura_commerciale");
    if (fattura?.codice_hs_nel_doc && pratica.codice_taric_selezionato) {
        const hsFattura = fattura.codice_hs_nel_doc.replace(/\./g, "").substring(0, 6);
        const hsClassif = pratica.codice_taric_selezionato.replace(/\./g, "").substring(0, 6);
        if (hsFattura !== hsClassif) {
            anomalie.push({
                codice: "DOG_HS_MISMATCH",
                categoria: "coerenza",
                severita: "alta",
                messaggio: `Codice HS in fattura (${fattura.codice_hs_nel_doc}) diverso dalla classificazione di sistema (${pratica.codice_taric_selezionato})`,
                raccomandazione: "Il codice HS in fattura deve corrispondere alla classificazione TARIC. Richiedere correzione al fornitore cinese o aggiornare la classificazione.",
                penalita: 20,
            });
        }
    }

    // ─── CHECK DOGANALE — cross-check incoterms fattura vs pratica ───────────

    if (fattura?.incoterms_doc && pratica.incoterms) {
        if (fattura.incoterms_doc.toUpperCase() !== pratica.incoterms.toUpperCase()) {
            anomalie.push({
                codice: "DOG_INCOTERMS_MISMATCH",
                categoria: "coerenza",
                severita: "media",
                messaggio: `Incoterms in fattura (${fattura.incoterms_doc}) diversi da quelli della pratica (${pratica.incoterms})`,
                raccomandazione: "Gli Incoterms devono essere coerenti tra fattura e contratto. Verificare quale sia il dato corretto.",
                penalita: 10,
            });
        }
    }

    // ─── CHECK DOGANALE — componenti trovati in fattura e packing list ─────────

    for (const comp of componenti) {
        const trovataInFattura = fattura?.componenti_trovati?.find(c => c.componente_id === comp.id);
        if (!trovataInFattura?.trovato && !trovataInFattura?.confermato_manualmente) {
            anomalie.push({
                codice: `DOG_COMP_NON_IN_FATTURA_${comp.id.substring(0, 8).toUpperCase()}`,
                categoria: "coerenza",
                severita: "alta",
                messaggio: `Componente "${comp.descrizione}" non trovato nella fattura commerciale`,
                raccomandazione: `Ogni componente deve essere elencato separatamente in fattura con il proprio valore. Richiedere fattura aggiornata al fornitore.`,
                penalita: 10,
            });
        }

        const trovataInPL = pl?.componenti_trovati?.find(c => c.componente_id === comp.id);
        if (!trovataInPL?.trovato && !trovataInPL?.confermato_manualmente) {
            anomalie.push({
                codice: `DOG_COMP_NON_IN_PL_${comp.id.substring(0, 8).toUpperCase()}`,
                categoria: "coerenza",
                severita: "media",
                messaggio: `Componente "${comp.descrizione}" non trovato nella packing list`,
                raccomandazione: `Ogni componente deve essere elencato con peso e colli nella packing list.`,
                penalita: 5,
            });
        }
    }

    return buildResult(anomalie, documenti_ce, documenti_doganali, componenti);
}

// ─── Helper: calcolo peso totale atteso ───────────────────────────────────────

function calcolaPesoTotale(macchinario: MacchinarioInput, componenti: ComponenteInput[]): number {
    let peso = Number(macchinario.peso_lordo_kg ?? 0);
    for (const comp of componenti) {
        peso += Number(comp.peso_kg ?? 0) * ((comp as any).quantita ?? 1);
    }
    return peso;
}

// ─── Helper: calcolo score finale ────────────────────────────────────────────

function buildResult(
    anomalie: CrossCheckAnomalia[],
    documenti_ce: DocumentoCEInput[],
    documenti_doganali: DocumentoDoganaleInput[],
    componenti: ComponenteInput[],
): CrossCheckResult {
    // Score CE (penalità solo da categoria "ce")
    const penalitaCE = anomalie
        .filter(a => a.categoria === "ce")
        .reduce((sum, a) => sum + a.penalita, 0);
    const score_ce = Math.max(0, 100 - penalitaCE);

    // Score doganale (penalità solo da categoria "doganale")
    const penalitaDog = anomalie
        .filter(a => a.categoria === "doganale")
        .reduce((sum, a) => sum + a.penalita, 0);
    const score_doganale = Math.max(0, 100 - penalitaDog);

    // Score coerenza (penalità solo da categoria "coerenza")
    const penalitaCoer = anomalie
        .filter(a => a.categoria === "coerenza")
        .reduce((sum, a) => sum + a.penalita, 0);
    const score_coerenza = Math.max(0, 100 - penalitaCoer);

    // Cap sulle anomalie critiche: un'anomalia critica non può essere mascherata
    // da score alti in altre categorie.
    // 1 critica  → score globale max 65 (livello "medio")
    // 2+ critiche → score globale max 45 (livello "alto")
    // Questo cap viene applicato nel calcolo dello score_globale in route.ts,
    // ma lo esportiamo qui per usarlo anche nel frontend.
    const critiche = anomalie.filter(a => a.severita === "critica").length;
    const cap_score_globale = critiche >= 2 ? 45 : critiche === 1 ? 65 : 100;

    return { anomalie, score_ce, score_doganale, score_coerenza, cap_score_globale };
}
