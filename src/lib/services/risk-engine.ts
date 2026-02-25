// ─── Risk Score Engine ───────────────────────────────────────────────────────
// Formula: SCORE_GLOBALE = (SCORE_CE × 0.55) + (SCORE_DOGANALE × 0.45)

export interface Penalty {
    codice: string;
    categoria: string;
    descrizione: string;
    penalita: number;
    severity: "critica" | "alta" | "media" | "bassa";
}

export interface RiskResult {
    score_globale: number;
    score_compliance_ce: number;
    score_doganale: number;
    livello_rischio: "basso" | "medio" | "alto" | "critico";
    dettaglio_penalita: Penalty[];
    raccomandazioni: string[];
}

export function getLivelloRischio(score: number): "basso" | "medio" | "alto" | "critico" {
    if (score >= 80) return "basso";
    if (score >= 60) return "medio";
    if (score >= 40) return "alto";
    return "critico";
}

export function calcolaRiskScore(input: {
    documenti_ce: Array<{
        tipo_documento: string;
        stato_validazione: string;
        normativa_citata?: string | null;
        normativa_valida?: boolean | null;
        firmato?: boolean | null;
        mandatario_ue?: string | null;
        anomalie_rilevate?: any;
    }>;
    organismo?: { stato_verifica: string } | null;
    documenti_doganali: Array<{
        tipo_documento: string;
        stato_validazione: string;
        codice_hs_nel_doc?: string | null;
        valore_commerciale?: string | null;
        anomalie_rilevate?: any;
    }>;
    codice_hs_selezionato?: string | null;
}): RiskResult {
    const penalita: Penalty[] = [];
    const raccomandazioni: string[] = [];

    // ── CE Penalties ──────────────────────────────────────────────────────────
    const docsCE = input.documenti_ce;
    const tipiCE = docsCE.map(d => d.tipo_documento);

    if (!tipiCE.includes("dichiarazione_ce")) {
        penalita.push({ codice: "CE-DOC-001", categoria: "Documento mancante", descrizione: "Dichiarazione CE di Conformità assente", penalita: -25, severity: "critica" });
        raccomandazioni.push("Richiedere al fornitore la Dichiarazione CE di Conformità ai sensi del Reg. UE 2023/1230");
    }
    if (!tipiCE.includes("manuale_uso")) {
        penalita.push({ codice: "CE-DOC-002", categoria: "Documento mancante", descrizione: "Manuale d'uso in italiano assente", penalita: -20, severity: "alta" });
        raccomandazioni.push("Richiedere al fornitore traduzione del manuale in italiano");
    }
    if (!tipiCE.includes("fascicolo_tecnico")) {
        penalita.push({ codice: "CE-DOC-003", categoria: "Documento mancante", descrizione: "Fascicolo Tecnico assente", penalita: -20, severity: "alta" });
        raccomandazioni.push("Richiedere il Fascicolo Tecnico completo (Reg. UE 2023/1230, All. VII)");
    }
    if (!tipiCE.includes("analisi_rischi")) {
        penalita.push({ codice: "CE-DOC-004", categoria: "Documento mancante", descrizione: "Analisi dei rischi assente (ISO 12100:2010)", penalita: -15, severity: "alta" });
        raccomandazioni.push("Richiedere analisi dei rischi conforme ISO 12100:2010");
    }
    if (!tipiCE.includes("schemi_elettrici")) {
        penalita.push({ codice: "CE-DOC-005", categoria: "Documento mancante", descrizione: "Schemi elettrici assenti", penalita: -10, severity: "media" });
    }

    // Normativa citations
    for (const doc of docsCE) {
        if (doc.normativa_valida === false) {
            penalita.push({ codice: "CE-NORM-001", categoria: "Normativa", descrizione: `Normativa obsoleta citata in ${doc.tipo_documento}`, penalita: -20, severity: "alta" });
            raccomandazioni.push(`Aggiornare ${doc.tipo_documento} alla normativa Reg. UE 2023/1230 (in vigore)`);
            break;
        }
        if (doc.tipo_documento === "dichiarazione_ce" && !doc.normativa_citata) {
            penalita.push({ codice: "CE-NORM-002", categoria: "Normativa", descrizione: "Normativa non specificata nella Dichiarazione CE", penalita: -15, severity: "alta" });
            break;
        }
    }

    // Field checks for dichiarazione_ce
    const dichCE = docsCE.find(d => d.tipo_documento === "dichiarazione_ce");
    if (dichCE) {
        if (!dichCE.firmato) {
            penalita.push({ codice: "CE-FIELD-001", categoria: "Campo mancante", descrizione: "Firma mancante nella Dichiarazione CE", penalita: -10, severity: "media" });
        }
        if (!dichCE.mandatario_ue) {
            penalita.push({ codice: "CE-FIELD-003", categoria: "Campo mancante", descrizione: "Mandatario UE non indicato (produttore extra-UE)", penalita: -15, severity: "alta" });
            raccomandazioni.push("Verificare con il fornitore se è stato nominato un Mandatario UE");
        }
    }

    // Organismo notificato
    if (!input.organismo || input.organismo.stato_verifica === "non_verificato") {
        penalita.push({ codice: "CE-NB-003", categoria: "Organismo", descrizione: "Organismo notificato non verificato", penalita: -10, severity: "media" });
    } else if (input.organismo.stato_verifica === "non_trovato") {
        penalita.push({ codice: "CE-NB-001", categoria: "Organismo", descrizione: "Organismo notificato non trovato nel registro NANDO", penalita: -20, severity: "alta" });
        raccomandazioni.push("Verificare la validità dell'organismo notificato con NANDO");
    } else if (input.organismo.stato_verifica === "non_autorizzato") {
        penalita.push({ codice: "CE-NB-002", categoria: "Organismo", descrizione: "Organismo non autorizzato per questa tipologia", penalita: -25, severity: "critica" });
    }

    // ── Doganale Penalties ────────────────────────────────────────────────────
    const docsDoganali = input.documenti_doganali;
    const tipiDog = docsDoganali.map(d => d.tipo_documento);

    if (!tipiDog.includes("bill_of_lading")) {
        penalita.push({ codice: "DG-DOC-001", categoria: "Documento mancante", descrizione: "Bill of Lading assente", penalita: -25, severity: "critica" });
        raccomandazioni.push("Richiedere all'armatore il Bill of Lading originale (OBL)");
    }
    if (!tipiDog.includes("fattura_commerciale")) {
        penalita.push({ codice: "DG-DOC-002", categoria: "Documento mancante", descrizione: "Fattura commerciale assente", penalita: -25, severity: "critica" });
        raccomandazioni.push("Richiedere al fornitore la fattura commerciale con tutti i dati obbligatori");
    }
    if (!tipiDog.includes("packing_list")) {
        penalita.push({ codice: "DG-DOC-003", categoria: "Documento mancante", descrizione: "Packing list assente", penalita: -15, severity: "alta" });
    }

    if (!input.codice_hs_selezionato) {
        penalita.push({ codice: "DG-HS-001", categoria: "Classificazione", descrizione: "Codice HS non ancora selezionato", penalita: -20, severity: "alta" });
        raccomandazioni.push("Effettuare la classificazione HS/TARIC nella sezione apposita");
    }

    // Check valore commerciale
    const fattura = docsDoganali.find(d => d.tipo_documento === "fattura_commerciale");
    if (fattura && !fattura.valore_commerciale) {
        penalita.push({ codice: "DG-FIELD-003", categoria: "Campo mancante", descrizione: "Valore commerciale mancante in fattura", penalita: -15, severity: "alta" });
    }

    // ── Calculate scores ──────────────────────────────────────────────────────
    const CE_CODES = ["CE-DOC-001", "CE-DOC-002", "CE-DOC-003", "CE-DOC-004", "CE-DOC-005", "CE-NORM-001", "CE-NORM-002", "CE-FIELD-001", "CE-FIELD-002", "CE-FIELD-003", "CE-FIELD-004", "CE-COH-001", "CE-COH-002", "CE-NB-001", "CE-NB-002", "CE-NB-003"];
    const DG_CODES = ["DG-DOC-001", "DG-DOC-002", "DG-DOC-003", "DG-HS-001", "DG-HS-002", "DG-HS-003", "DG-COH-001", "DG-COH-002", "DG-COH-003", "DG-FIELD-001", "DG-FIELD-002", "DG-FIELD-003"];

    const totalCE = penalita.filter(p => CE_CODES.includes(p.codice)).reduce((s, p) => s + Math.abs(p.penalita), 0);
    const totalDG = penalita.filter(p => DG_CODES.includes(p.codice)).reduce((s, p) => s + Math.abs(p.penalita), 0);

    const score_ce = Math.max(0, 100 - Math.min(100, totalCE));
    const score_dg = Math.max(0, 100 - Math.min(100, totalDG));
    const score_globale = Math.round(score_ce * 0.55 + score_dg * 0.45);

    return {
        score_globale,
        score_compliance_ce: score_ce,
        score_doganale: score_dg,
        livello_rischio: getLivelloRischio(score_globale),
        dettaglio_penalita: penalita,
        raccomandazioni: [...new Set(raccomandazioni)],
    };
}
