/**
 * Test del cross-check engine
 * Esegui con: npx tsx src/lib/cross-check.test.ts
 */

import { runCrossChecks, CrossCheckResult } from "./cross-check";

// ─── Utilities di output ──────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function printResult(nome: string, result: CrossCheckResult) {
    console.log(`\n${BOLD}${BLUE}═══════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD} SCENARIO: ${nome}${RESET}`);
    console.log(`${BLUE}═══════════════════════════════════════════════════${RESET}`);

    const scoreColor = (s: number) => s >= 80 ? GREEN : s >= 60 ? YELLOW : RED;

    console.log(`\n ${BOLD}SCORE${RESET}`);
    console.log(`  CE Compliance  : ${scoreColor(result.score_ce)}${result.score_ce}/100${RESET}`);
    console.log(`  Doganale       : ${scoreColor(result.score_doganale)}${result.score_doganale}/100${RESET}`);
    console.log(`  Coerenza dati  : ${scoreColor(result.score_coerenza)}${result.score_coerenza}/100${RESET}`);

    if (result.anomalie.length === 0) {
        console.log(`\n ${GREEN}✓ Nessuna anomalia rilevata${RESET}`);
    } else {
        console.log(`\n ${BOLD}ANOMALIE (${result.anomalie.length})${RESET}`);
        for (const a of result.anomalie) {
            const icon = a.severita === "critica" ? `${RED}●` : a.severita === "alta" ? `${RED}◆` : a.severita === "media" ? `${YELLOW}◆` : `${DIM}◆`;
            console.log(`\n  ${icon} [${a.severita.toUpperCase()}] -${a.penalita}pt${RESET}`);
            console.log(`    ${BOLD}${a.messaggio}${RESET}`);
            console.log(`    ${DIM}→ ${a.raccomandazione}${RESET}`);
        }
    }
    console.log("");
}

// ─── SCENARIO 1: Pratica ideale — tutto presente e coerente ─────────────────

const scenario1 = runCrossChecks({
    pratica: {
        eori_importatore: "IT12345678901",
        incoterms: "FOB",
        porto_arrivo: "Genova",
        fornitore_cinese: "Haitian International Holdings Ltd",
        codice_taric_selezionato: "847710",
    },
    macchinario: {
        nome_macchina: "Pressa ad iniezione Haitian MA5500/II",
        marca: "Haitian",
        modello: "MA5500/II",
        numero_seriale: "HT-2024-0892",
        anno_produzione: 2024,
        stato_macchina: "nuova",
        tipo_azionamento: "idraulico",
        potenza_kw: 45,
        peso_lordo_kg: 4200,
        peso_netto_kg: 3980,
        numero_colli_macchina: 1,
        robot_estrazione_integrato: false,
        sistemi_pneumatici_ausiliari: false,
    },
    componenti: [],
    documenti_ce: [
        {
            tipo_documento: "dichiarazione_ce",
            stato_validazione: "valido",
            norme_armonizzate: ["Dir. 2006/42/CE", "EN ISO 20430:2021", "ISO 12100:2010", "CEI EN 60204-1"],
            normativa_citata: "Dir. 2006/42/CE",
            data_documento: "2024-03-15",
            dati_estratti: {
                numero_seriale: "HT-2024-0892",
                modello: "MA5500/II",
                marca: "Haitian",
                anno_produzione: 2024,
            },
        },
        { tipo_documento: "manuale_uso", stato_validazione: "valido", norme_armonizzate: [] },
        {
            tipo_documento: "fascicolo_tecnico",
            stato_validazione: "valido",
            norme_armonizzate: [],
            dati_estratti: {
                contiene_schemi_elettrici: true,
                contiene_schemi_idraulici: true,
            } as any,
        },
        { tipo_documento: "analisi_rischi", stato_validazione: "valido", norme_armonizzate: ["ISO 12100:2010"] },
    ],
    documenti_doganali: [
        {
            tipo_documento: "bill_of_lading",
            stato_validazione: "valido",
            peso_doc_kg: 4200,
            codice_hs_nel_doc: "847710",
            incoterms_doc: "FOB",
            numero_colli_doc: 1,
            componenti_trovati: [],
        },
        {
            tipo_documento: "fattura_commerciale",
            stato_validazione: "valido",
            peso_doc_kg: null,
            valore_commerciale: 85000,
            codice_hs_nel_doc: "847710",
            incoterms_doc: "FOB",
            componenti_trovati: [],
        },
        {
            tipo_documento: "packing_list",
            stato_validazione: "valido",
            peso_doc_kg: 4200,
            codice_hs_nel_doc: "847710",
            componenti_trovati: [],
        },
    ],
});

printResult("Pratica ideale — tutto completo e coerente", scenario1);

// ─── SCENARIO 2: Pratica con problemi critici CE ──────────────────────────────

const scenario2 = runCrossChecks({
    pratica: {
        eori_importatore: "IT12345678901",
        incoterms: "FOB",
        porto_arrivo: "Genova",
        fornitore_cinese: "Haitian International Holdings Ltd",
        codice_taric_selezionato: "847710",
    },
    macchinario: {
        nome_macchina: "Pressa ad iniezione Haitian MA5500/II",
        marca: "Haitian",
        modello: "MA5500/II",
        numero_seriale: "HT-2024-0892",
        anno_produzione: 2018,
        stato_macchina: "usata", // ← macchina usata
        tipo_azionamento: "idraulico",
        potenza_kw: 45,
        peso_lordo_kg: 4200,
        robot_estrazione_integrato: false,
        sistemi_pneumatici_ausiliari: false,
    },
    componenti: [
        {
            id: "comp-001",
            descrizione: "Robot di estrazione YUSHIN RG-125",
            numero_seriale: "YS-2024-001",
            peso_kg: 420,
            valore_commerciale: 8500,
            ha_marcatura_ce: true, // ← CE obbligatoria, ma nessun doc caricato
        },
    ],
    documenti_ce: [
        {
            tipo_documento: "dichiarazione_ce",
            stato_validazione: "valido",
            norme_armonizzate: ["Dir. 2006/42/CE", "ISO 12100:2010"],
            // ← EN ISO 20430 NON citata
            normativa_citata: "Dir. 2006/42/CE",
            data_documento: "2018-05-10",
            dati_estratti: {
                numero_seriale: "HT-2024-0892",
                modello: "MA5500/II",
            },
        },
        { tipo_documento: "manuale_uso", stato_validazione: "valido", norme_armonizzate: [] },
        // ← fascicolo tecnico mancante
        // ← analisi rischi mancante (critico per macchina usata)
    ],
    documenti_doganali: [
        {
            tipo_documento: "bill_of_lading",
            stato_validazione: "valido",
            peso_doc_kg: 4200,
            codice_hs_nel_doc: "847710",
            incoterms_doc: "FOB",
            componenti_trovati: [],
        },
        {
            tipo_documento: "fattura_commerciale",
            stato_validazione: "valido",
            peso_doc_kg: null,
            valore_commerciale: 45000,
            codice_hs_nel_doc: "847710",
            incoterms_doc: "FOB",
            componenti_trovati: [
                // ← robot non trovato in fattura
            ],
        },
        {
            tipo_documento: "packing_list",
            stato_validazione: "valido",
            peso_doc_kg: 4200,
            // ← peso mancante per il robot (totale atteso = 4200+420 = 4620)
            componenti_trovati: [],
        },
    ],
});

printResult("Macchina usata — problemi CE + componente senza doc", scenario2);

// ─── SCENARIO 3: Problemi doganali — incoerenze peso e HS ────────────────────

const scenario3 = runCrossChecks({
    pratica: {
        eori_importatore: null, // ← EORI mancante
        incoterms: "CIF",       // ← CIF ma niente assicurazione
        porto_arrivo: "Trieste",
        fornitore_cinese: "Ningbo Machinery Co. Ltd",
        codice_taric_selezionato: "847710",
    },
    macchinario: {
        nome_macchina: "Pressa ad iniezione",
        marca: "Ningbo",
        modello: "NB-3300",
        numero_seriale: "NB-2024-100",
        anno_produzione: 2024,
        stato_macchina: "nuova",
        tipo_azionamento: "elettrico",
        potenza_kw: 30,
        peso_lordo_kg: 3500,
        robot_estrazione_integrato: false,
        sistemi_pneumatici_ausiliari: false,
    },
    componenti: [],
    documenti_ce: [
        {
            tipo_documento: "dichiarazione_ce",
            stato_validazione: "valido",
            norme_armonizzate: ["Dir. 2006/42/CE", "EN ISO 20430:2021", "ISO 12100:2010"],
            normativa_citata: "Dir. 2006/42/CE",
            dati_estratti: { numero_seriale: "NB-2024-100" },
        },
        { tipo_documento: "manuale_uso", stato_validazione: "valido", norme_armonizzate: [] },
        {
            tipo_documento: "fascicolo_tecnico",
            stato_validazione: "valido",
            norme_armonizzate: [],
            dati_estratti: { contiene_schemi_elettrici: true } as any,
        },
        { tipo_documento: "analisi_rischi", stato_validazione: "valido", norme_armonizzate: [] },
    ],
    documenti_doganali: [
        {
            tipo_documento: "bill_of_lading",
            stato_validazione: "valido",
            peso_doc_kg: 4200,   // ← 700kg più del dichiarato (3500kg)
            codice_hs_nel_doc: "847780", // ← HS sbagliato vs 847710
            incoterms_doc: "FOB",        // ← diverso da CIF della pratica
            componenti_trovati: [],
        },
        {
            tipo_documento: "fattura_commerciale",
            stato_validazione: "valido",
            valore_commerciale: 55000,
            codice_hs_nel_doc: "847780", // ← HS sbagliato
            incoterms_doc: "FOB",         // ← diverso da CIF della pratica
            componenti_trovati: [],
        },
        {
            tipo_documento: "packing_list",
            stato_validazione: "valido",
            peso_doc_kg: 3900,  // ← diverso dal BL (4200kg)
            componenti_trovati: [],
        },
        // ← insurance_certificate mancante con CIF
    ],
});

printResult("Problemi doganali — EORI mancante, HS sbagliato, peso incoerente", scenario3);

// ─── RIEPILOGO ────────────────────────────────────────────────────────────────

console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD} RIEPILOGO SCENARI${RESET}`);
console.log(`${BLUE}═══════════════════════════════════════════════════${RESET}\n`);

const scenari = [
    { nome: "Pratica ideale", result: scenario1 },
    { nome: "Macchina usata / CE problemi", result: scenario2 },
    { nome: "Problemi doganali", result: scenario3 },
];

for (const { nome, result } of scenari) {
    const peso_ce = 0.50, peso_dog = 0.35, peso_coer = 0.15;
    const grezzo = Math.round(result.score_ce * peso_ce + result.score_doganale * peso_dog + result.score_coerenza * peso_coer);
    const globale = Math.min(result.cap_score_globale, grezzo);
    const livello = globale >= 80 ? `${GREEN}BASSO` : globale >= 60 ? `${YELLOW}MEDIO` : globale >= 40 ? `${RED}ALTO` : `${RED}CRITICO`;
    const capNote = result.cap_score_globale < 100 ? ` ${YELLOW}[cap ${result.cap_score_globale} per anomalie critiche]${RESET}` : "";
    console.log(`  ${nome.padEnd(35)} Score: ${globale}/100  Rischio: ${livello}${RESET}${capNote}  (${result.anomalie.length} anomalie)`);
}

console.log("");
