/**
 * Registro centralizzato delle normative e codici di riferimento
 *
 * QUESTO FILE È LA FONTE DI VERITÀ per tutti i riferimenti normativi usati
 * nel sistema. Ogni modifica deve essere tracciata con data e fonte di verifica.
 *
 * Metodi di verifica:
 *   "eurlex_sparql" → verifica automatica via EUR-Lex SPARQL (gratuita, ufficiale UE)
 *   "human"         → verifica manuale obbligatoria (ISO/EN non hanno API pubblica)
 *   "taric_web"     → verifica tramite consultazione TARIC (link diretto, nessuna API gratuita)
 */

// ─── Tipi ─────────────────────────────────────────────────────────────────────

export type NormativaType =
    | "direttiva_ue"       // Dir. 2006/42/CE, Dir. 2014/30/UE...
    | "regolamento_ue"     // Reg. UE 2023/1230...
    | "norma_iso"          // ISO 12100, EN ISO 20430...
    | "norma_en"           // EN solo (CEI EN 60204-1...)
    | "codice_hs";         // Codici TARIC/SA

export type NormativaStatus =
    | "in_vigore"          // attualmente applicabile
    | "in_vigore_dal"      // pubblicata ma non ancora applicabile
    | "abrogata"           // non più in vigore
    | "da_verificare";     // stato sconosciuto — richiede revisione umana

export type VerificaMetodo = "eurlex_sparql" | "human" | "taric_web";

export interface NormativaRef {
    id: string;
    codice: string;                   // es. "Dir. 2006/42/CE", "EN ISO 20430:2020"
    nome: string;
    tipo: NormativaType;
    status: NormativaStatus;
    in_vigore_dal?: string;           // ISO date YYYY-MM-DD
    in_vigore_al?: string;            // null = ancora in vigore
    successore_id?: string;           // ID del documento che lo sostituisce
    url_fonte: string;                // URL alla fonte ufficiale del documento
    url_verifica?: string;            // URL specifico per verifica status (es. TARIC consultation)
    celex?: string;                   // CELEX number (solo per atti UE) — usato per EUR-Lex SPARQL
    verifica_metodo: VerificaMetodo;
    verificato_il: string;            // ISO date dell'ultima verifica
    verificato_da: string;            // "human:nome" | "auto:eurlex"
    note?: string;
}

export interface CodiceHSRef {
    codice: string;                   // 6 o 10 cifre (SA o TARIC)
    descrizione: string;
    url_taric: string;                // link diretto alla consultazione TARIC per questo codice
    verificato_il: string;
    verificato_da: string;
    note?: string;
}

// ─── Normative ────────────────────────────────────────────────────────────────

export const NORMATIVE: Record<string, NormativaRef> = {

    // ── Direttive e Regolamenti UE ────────────────────────────────────────────

    DIR_2006_42_CE: {
        id: "DIR_2006_42_CE",
        codice: "Dir. 2006/42/CE",
        nome: "Direttiva Macchine",
        tipo: "direttiva_ue",
        status: "in_vigore",
        in_vigore_dal: "2009-12-29",
        in_vigore_al: "2027-01-19",
        successore_id: "REG_UE_2023_1230",
        url_fonte: "https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32006L0042",
        celex: "32006L0042",
        verifica_metodo: "eurlex_sparql",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Applicabile fino al 19/01/2027. Dal 20/01/2027 sostituita da Reg. UE 2023/1230",
    },

    REG_UE_2023_1230: {
        id: "REG_UE_2023_1230",
        codice: "Reg. UE 2023/1230",
        nome: "Regolamento Macchine (nuova Direttiva Macchine)",
        tipo: "regolamento_ue",
        status: "in_vigore_dal",
        in_vigore_dal: "2027-01-20",
        url_fonte: "https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32023R1230",
        celex: "32023R1230",
        verifica_metodo: "eurlex_sparql",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Sostituisce Dir. 2006/42/CE. Applicabile dal 20/01/2027 (pubblicato GU UE L 165, 29/06/2023)",
    },

    // ── Norme tecniche armonizzate (tipo C — specifiche per macchina) ─────────

    EN_ISO_20430_2020: {
        id: "EN_ISO_20430_2020",
        codice: "EN ISO 20430:2020",
        nome: "Presse ad iniezione per gomma e materie plastiche — Requisiti di sicurezza",
        tipo: "norma_iso",
        status: "in_vigore",
        in_vigore_dal: "2020-07-31",
        url_fonte: "https://www.iso.org/standard/68000.html",
        url_verifica: "https://www.iso.org/standard/68000.html",
        verifica_metodo: "human",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Norma di tipo C specifica per presse ad iniezione. Sostituisce EN ISO 20430:2008",
    },

    // ── Norme tecniche di base (tipo A/B — applicabili a tutte le macchine) ───

    ISO_12100_2010: {
        id: "ISO_12100_2010",
        codice: "ISO 12100:2010",
        nome: "Sicurezza del macchinario — Principi generali di progettazione — Valutazione e riduzione del rischio",
        tipo: "norma_iso",
        status: "in_vigore",
        in_vigore_dal: "2010-11-01",
        url_fonte: "https://www.iso.org/standard/51528.html",
        url_verifica: "https://www.iso.org/standard/51528.html",
        verifica_metodo: "human",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Norma di tipo A. Fondamentale per qualsiasi analisi dei rischi",
    },

    CEI_EN_60204_1: {
        id: "CEI_EN_60204_1",
        codice: "CEI EN 60204-1",
        nome: "Sicurezza del macchinario — Equipaggiamento elettrico delle macchine industriali",
        tipo: "norma_en",
        status: "in_vigore",
        in_vigore_dal: "2018-01-01",
        url_fonte: "https://www.iec.ch/publication/23813",
        url_verifica: "https://www.iec.ch/publication/23813",
        verifica_metodo: "human",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Obbligatoria per schemi elettrici nel fascicolo tecnico",
    },

    EN_ISO_4413_2011: {
        id: "EN_ISO_4413_2011",
        codice: "EN ISO 4413:2011",
        nome: "Trasmissioni idrauliche — Regole generali e requisiti di sicurezza",
        tipo: "norma_iso",
        status: "in_vigore",
        in_vigore_dal: "2011-01-01",
        url_fonte: "https://www.iso.org/standard/54955.html",
        verifica_metodo: "human",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Richiesta per schemi idraulici se tipo_azionamento = idraulico o ibrido",
    },

    EN_ISO_4414_2011: {
        id: "EN_ISO_4414_2011",
        codice: "EN ISO 4414:2011",
        nome: "Trasmissioni pneumatiche — Regole generali e requisiti di sicurezza",
        tipo: "norma_iso",
        status: "in_vigore",
        in_vigore_dal: "2011-01-01",
        url_fonte: "https://www.iso.org/standard/54956.html",
        verifica_metodo: "human",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Richiesta per schemi pneumatici se sistemi_pneumatici_ausiliari = true",
    },
};

// ─── Codici HS / TARIC ────────────────────────────────────────────────────────

export const HS_CODICI: Record<string, CodiceHSRef> = {

    "847710": {
        codice: "847710",
        descrizione: "Macchine per lo stampaggio a iniezione per la lavorazione della gomma o delle materie plastiche",
        url_taric: "https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp?Lang=IT&Expand=true&Product=8477100000&OrigCtry=CN&DestCtry=IT",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Codice principale per presse ad iniezione plastica. Aliquota dazio: 2.7% (CN → IT, verifica su TARIC)",
    },

    "847780": {
        codice: "847780",
        descrizione: "Altre macchine per la lavorazione della gomma o delle materie plastiche",
        url_taric: "https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp?Lang=IT&Expand=true&Product=8477800000&OrigCtry=CN&DestCtry=IT",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Codice generico — usarlo solo se 847710 non è applicabile",
    },

    "847990": {
        codice: "847990",
        descrizione: "Altre macchine e apparecchi meccanici con funzione propria n.a.s.",
        url_taric: "https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp?Lang=IT&Expand=true&Product=8479900000&OrigCtry=CN&DestCtry=IT",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Per parti/accessori non classificabili altrove",
    },

    "848071": {
        codice: "848071",
        descrizione: "Stampi per lo stampaggio a iniezione o per compressione",
        url_taric: "https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp?Lang=IT&Expand=true&Product=8480710000&OrigCtry=CN&DestCtry=IT",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Codice per stampi — componente aggiuntivo comune nella fornitura",
    },

    "847950": {
        codice: "847950",
        descrizione: "Robot industriali n.a.s.",
        url_taric: "https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp?Lang=IT&Expand=true&Product=8479500000&OrigCtry=CN&DestCtry=IT",
        verificato_il: "2026-02-27",
        verificato_da: "human:setup-iniziale",
        note: "Codice per robot di estrazione se fatturati separatamente",
    },
};

// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Restituisce la normativa macchine attualmente in vigore
 * (Dir. 2006/42/CE fino al 19/01/2027, poi Reg. UE 2023/1230)
 */
export function getNormativaVigenteMacchine(): NormativaRef {
    const oggi = new Date();
    const regUE = NORMATIVE.REG_UE_2023_1230;
    if (regUE.in_vigore_dal && oggi >= new Date(regUE.in_vigore_dal)) {
        return regUE;
    }
    return NORMATIVE.DIR_2006_42_CE;
}

/**
 * Verifica se una normativa è scaduta o prossima alla scadenza (entro N giorni)
 */
export function isNormativaScadenzaImminente(norm: NormativaRef, giorniAvviso = 180): boolean {
    if (!norm.in_vigore_al) return false;
    const scadenza = new Date(norm.in_vigore_al);
    const soglia = new Date();
    soglia.setDate(soglia.getDate() + giorniAvviso);
    return scadenza <= soglia;
}

/**
 * Restituisce i giorni dall'ultima verifica di una normativa
 */
export function giorniDaUltimaVerifica(norm: NormativaRef | CodiceHSRef): number {
    const ultima = new Date(norm.verificato_il);
    const oggi = new Date();
    return Math.floor((oggi.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Restituisce true se la verifica è da rinnovare (> 90 giorni per auto, > 365 per human)
 */
export function isVerificaScaduta(norm: NormativaRef): boolean {
    const giorni = giorniDaUltimaVerifica(norm);
    if ("verifica_metodo" in norm) {
        return norm.verifica_metodo === "eurlex_sparql" ? giorni > 90 : giorni > 365;
    }
    return giorni > 365;
}

/**
 * Elenco di tutte le normative con verifica scaduta
 */
export function getNormativeScadute(): NormativaRef[] {
    return Object.values(NORMATIVE).filter(isVerificaScaduta);
}

/**
 * Codice HS default per presse ad iniezione plastica
 */
export const HS_DEFAULT_PRESSA_INIEZIONE = "847710";
