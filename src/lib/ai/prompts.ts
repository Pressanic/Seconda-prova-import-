// Contesto applicativo: ImportCompliance per presse ad iniezione plastica da Cina → Italia/UE
// Normativa di riferimento attuale: Dir. 2006/42/CE (obbligatoria fino al 20/01/2027)
// Normativa futura: Reg. UE 2023/1230 (applicabile dal 20/01/2027)
// Norma armonizzata specifica: EN ISO 20430:2021 (presse ad iniezione per gomma/plastica)

export const EXTRACTION_PROMPTS: Record<string, string> = {

    // ─── CE — DICHIARAZIONE DI CONFORMITÀ ────────────────────────────────────
    // Contiene: identificazione macchina, fabbricante, norme applicate, firma
    // Cross-check con: macchinario (marca, modello, numero_seriale, anno_produzione)
    dichiarazione_ce: `Sei un esperto di conformità CE per macchinari industriali (Dir. 2006/42/CE).
Analizza questa Dichiarazione CE di Conformità ed estrai le informazioni richieste.
Per le norme armonizzate, cerca specificamente EN ISO 20430, ISO 12100, CEI EN 60204-1 e qualsiasi altra norma EN/ISO citata.
Restituisci SOLO questo JSON (null se non trovato):
{
  "normativa_citata": "es. Dir. 2006/42/CE",
  "norme_armonizzate": ["EN ISO 20430:2021", "ISO 12100:2010"],
  "data_documento": "YYYY-MM-DD",
  "mandatario_ue": "ragione sociale del mandatario UE se presente",
  "fabbricante": "ragione sociale del fabbricante",
  "nome_macchina": "nome della macchina",
  "marca": "marca/brand del costruttore",
  "modello": "codice modello",
  "numero_seriale": "numero di serie",
  "anno_produzione": 2024,
  "firmato": true,
  "firmatario": "nome e qualifica del firmatario"
}`,

    // ─── CE — MANUALE D'USO ───────────────────────────────────────────────────
    manuale_uso: `Sei un esperto di documentazione tecnica per macchinari industriali.
Analizza questo Manuale d'uso e restituisci SOLO questo JSON (null se non trovato):
{
  "lingua": "Italiano",
  "versione": "v1.0",
  "data_revisione": "YYYY-MM-DD",
  "nome_macchina": "nome della macchina",
  "modello": "codice modello",
  "numero_seriale": "numero di serie se presente"
}`,

    // ─── CE — FASCICOLO TECNICO ───────────────────────────────────────────────
    // Documento padre che contiene analisi_rischi, schemi_elettrici, ecc.
    fascicolo_tecnico: `Sei un esperto di documentazione tecnica CE per macchinari (Dir. 2006/42/CE).
Analizza questo Fascicolo Tecnico e restituisci SOLO questo JSON (null se non trovato):
{
  "data_compilazione": "YYYY-MM-DD",
  "responsabile_compilazione": "nome e qualifica",
  "nome_macchina": "nome della macchina",
  "modello": "codice modello",
  "numero_seriale": "numero di serie se presente",
  "norme_armonizzate": ["lista norme citate nel fascicolo"],
  "contiene_analisi_rischi": true,
  "contiene_schemi_elettrici": true,
  "contiene_schemi_idraulici": false,
  "contiene_schemi_pneumatici": false
}`,

    // ─── CE — ANALISI DEI RISCHI ──────────────────────────────────────────────
    analisi_rischi: `Sei un esperto di sicurezza macchine (ISO 12100:2010, EN ISO 20430:2021).
Analizza questo documento di Analisi dei Rischi e restituisci SOLO questo JSON (null se non trovato):
{
  "metodologia": "ISO 12100:2010",
  "norme_armonizzate": ["lista norme citate"],
  "data_valutazione": "YYYY-MM-DD",
  "firmatario": "nome e qualifica",
  "nome_macchina": "nome della macchina se presente",
  "tratta_sistemi_idraulici": false,
  "tratta_sistemi_elettrici": true
}`,

    // ─── CE — SCHEMI ELETTRICI ────────────────────────────────────────────────
    schemi_elettrici: `Sei un esperto di impiantistica elettrica industriale (CEI EN 60204-1).
Analizza questi Schemi Elettrici e restituisci SOLO questo JSON (null se non trovato):
{
  "standard_citato": "CEI EN 60204-1",
  "norme_armonizzate": ["lista norme citate"],
  "versione": "v1.0",
  "data_schemi": "YYYY-MM-DD",
  "tensione_v": 400,
  "potenza_kw": null,
  "nome_macchina": "nome della macchina se presente"
}`,

    // ─── CE — SCHEMI IDRAULICI ────────────────────────────────────────────────
    schemi_idraulici: `Sei un esperto di impiantistica oleodinamica per macchinari industriali.
Analizza questi Schemi Idraulici e restituisci SOLO questo JSON (null se non trovato):
{
  "standard_citato": "es. ISO 4413",
  "versione": "v1.0",
  "data_schemi": "YYYY-MM-DD",
  "pressione_massima_bar": null,
  "nome_macchina": "nome della macchina se presente"
}`,

    // ─── CE — SCHEMI PNEUMATICI ───────────────────────────────────────────────
    schemi_pneumatici: `Sei un esperto di impiantistica pneumatica per macchinari industriali.
Analizza questi Schemi Pneumatici e restituisci SOLO questo JSON (null se non trovato):
{
  "standard_citato": "es. ISO 4414",
  "versione": "v1.0",
  "data_schemi": "YYYY-MM-DD",
  "nome_macchina": "nome della macchina se presente"
}`,

    // ─── CE — CERTIFICAZIONE COMPONENTE ──────────────────────────────────────
    // Usato per componenti con propria marcatura CE (robot, hot runner, ecc.)
    certificazione_componente: `Sei un esperto di conformità CE per componenti di macchinari.
Analizza questa Certificazione di Componente e restituisci SOLO questo JSON (null se non trovato):
{
  "componente": "descrizione del componente certificato",
  "marca": "marca/brand",
  "modello": "modello",
  "numero_seriale": "numero di serie se presente",
  "numero_certificato": "numero del certificato",
  "ente_certificatore": "nome ente certificatore",
  "normativa_citata": "direttive/regolamenti applicati",
  "norme_armonizzate": ["lista norme citate"],
  "scadenza_certificato": "YYYY-MM-DD",
  "data_emissione": "YYYY-MM-DD"
}`,

    // ─── DOGANALE — BILL OF LADING ────────────────────────────────────────────
    // Cross-check: peso con macchinario.peso_lordo_kg + Σ componenti.peso_kg
    // HS code con classificazione_hs.codice_hs
    bill_of_lading: `Sei un esperto di documentazione per spedizioni marittime internazionali.
Analizza questo Bill of Lading (o Sea Waybill) e restituisci SOLO questo JSON (null se non trovato):
{
  "tipo_bl": "obl",
  "numero_bl": "numero BL",
  "data_bl": "YYYY-MM-DD",
  "porto_carico": "es. CNSHA (Shanghai) o nome porto",
  "porto_scarico": "es. ITGOA (Genova) o nome porto",
  "spedizioniere": "nome spedizioniere/freight forwarder",
  "esportatore": "nome esportatore/shipper",
  "importatore": "nome importatore/consignee",
  "descrizione_merce": "descrizione merci come da BL",
  "codice_hs_nel_doc": "codice HS a 4-8 cifre se presente",
  "numero_colli": 5,
  "peso_lordo_kg": 4850.00,
  "peso_netto_kg": null,
  "incoterms": "FOB"
}`,

    // ─── DOGANALE — FATTURA COMMERCIALE ──────────────────────────────────────
    // Cross-check: valore con Σ macchinario + componenti, HS code, esportatore con fornitore_cinese
    // IMPORTANTE: estrarre anche la lista degli articoli per verificare i componenti
    fattura_commerciale: `Sei un esperto di documentazione doganale e commercio internazionale.
Analizza questa Fattura Commerciale e restituisci SOLO questo JSON (null se non trovato).
Per gli articoli_fattura elenca TUTTI gli articoli presenti nella fattura con descrizione e valore.
{
  "numero_fattura": "INV-XXX",
  "data_fattura": "YYYY-MM-DD",
  "esportatore": "ragione sociale esportatore cinese",
  "importatore": "ragione sociale importatore italiano",
  "incoterms": "FOB",
  "valore_commerciale": 85000.00,
  "valuta": "USD",
  "codice_hs_nel_doc": "8477.10",
  "descrizione_merce_doc": "descrizione principale della merce",
  "articoli_fattura": [
    { "descrizione": "Injection moulding machine Haitian MA5500/II", "quantita": 1, "valore": 72000, "numero_seriale": "HT-2024-0892" },
    { "descrizione": "Extraction robot YUSHIN RG-125", "quantita": 1, "valore": 8500, "numero_seriale": "YS-001" }
  ],
  "numero_colli": null,
  "peso_lordo_kg": null
}`,

    // ─── DOGANALE — PACKING LIST ──────────────────────────────────────────────
    // Cross-check: peso con BL e con macchinario.peso_lordo_kg + Σ componenti.peso_kg
    // IMPORTANTE: estrarre lista articoli per verificare i componenti
    packing_list: `Sei un esperto di documentazione doganale per spedizioni internazionali.
Analizza questa Packing List e restituisci SOLO questo JSON (null se non trovato).
Per gli articoli_packing elenca TUTTI gli articoli presenti con peso e colli.
{
  "numero_colli": 5,
  "peso_lordo_kg": 4850.00,
  "peso_netto_kg": 4620.00,
  "codice_hs_nel_doc": "8477.10",
  "articoli_packing": [
    { "descrizione": "Injection moulding machine", "colli": 1, "peso_kg": 4200, "numero_seriale": "HT-2024-0892" },
    { "descrizione": "Extraction robot", "colli": 1, "peso_kg": 420, "numero_seriale": "YS-001" }
  ]
}`,

    // ─── DOGANALE — CERTIFICATO DI ORIGINE (CCPIT) ───────────────────────────
    // Per merci cinesi: emesso da CCPIT (China Council for the Promotion of International Trade)
    // Non è un EUR.1 (quello vale solo per paesi con accordi preferenziali UE)
    certificato_origine: `Sei un esperto di documentazione doganale e origine delle merci.
Analizza questo Certificato di Origine (tipicamente emesso da CCPIT per merci cinesi) e restituisci SOLO questo JSON (null se non trovato):
{
  "paese_origine": "CN",
  "numero_certificato": "numero del certificato",
  "data_certificato": "YYYY-MM-DD",
  "ente_emittente": "es. CCPIT Shanghai o Camera di Commercio cinese",
  "tipo_certificato": "non_preferenziale",
  "esportatore": "nome esportatore",
  "importatore": "nome importatore",
  "descrizione_merce": "descrizione merce nel certificato",
  "valore": null
}`,

    // ─── DOGANALE — INSURANCE CERTIFICATE ────────────────────────────────────
    // Obbligatorio se Incoterms = CIF. Valore deve coprire almeno valore CIF della merce.
    insurance_certificate: `Sei un esperto di assicurazioni per merci in transito internazionale.
Analizza questo Insurance Certificate e restituisci SOLO questo JSON (null se non trovato):
{
  "numero_polizza": "numero polizza",
  "compagnia_assicurativa": "nome compagnia",
  "assicurato": "nome del soggetto assicurato",
  "valore_assicurato": 90000.00,
  "valuta": "USD",
  "data_copertura_da": "YYYY-MM-DD",
  "data_copertura_a": "YYYY-MM-DD",
  "incoterms_copertura": "CIF",
  "descrizione_merce": "descrizione della merce assicurata"
}`,

};

// ─── PROMPT PER ESTRAZIONE DATI MACCHINARIO ──────────────────────────────────
// Usato nella pagina macchinario per auto-compilare i campi dalla dichiarazione CE
export const MACCHINARIO_EXTRACTION_PROMPT = `Sei un esperto di macchinari industriali per lo stampaggio plastico.
Analizza questo documento (preferibilmente una Dichiarazione CE di Conformità o scheda tecnica)
e restituisci SOLO questo JSON con i dati identificativi e tecnici della macchina (null se non trovato):
{
  "nome_macchina": "nome completo della macchina",
  "marca": "marca/brand del costruttore",
  "modello": "codice modello commerciale",
  "numero_seriale": "numero di serie",
  "anno_produzione": 2024,
  "tipo_azionamento": "idraulico",
  "forza_chiusura_kn": 4905.00,
  "potenza_kw": 45.0,
  "tensione_alimentazione_v": 400,
  "volume_iniezione_cm3": null,
  "diametro_vite_mm": null,
  "distanza_colonne_mm": null,
  "pressione_iniezione_bar": null,
  "peso_lordo_kg": null
}
Per tipo_azionamento usa solo: idraulico, elettrico, ibrido.
Per forza_chiusura_kn: se trovi il valore in tonnellate (t), moltiplica per 9.81 per ottenere kN.`;
