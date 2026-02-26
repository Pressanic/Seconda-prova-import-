export const EXTRACTION_PROMPTS: Record<string, string> = {
    dichiarazione_ce: `Sei un esperto di conformità CE. Analizza questa Dichiarazione CE di Conformità e restituisci in JSON con esattamente queste chiavi (null se non trovato):
{"normativa_citata":"es. Reg. UE 2023/1230","data_documento":"YYYY-MM-DD","mandatario_ue":"ragione sociale","nome_macchina":"nome","modello":"codice modello","numero_seriale":"SN-XXX","anno_produzione":2024,"firmato":true}
Rispondi SOLO con JSON valido, nessun testo aggiuntivo.`,

    manuale_uso: `Analizza questo documento (Manuale d'uso) e restituisci in JSON:
{"lingua":"Italiano","versione":"v1.0","data_revisione":"YYYY-MM-DD"}
Rispondi SOLO con JSON valido.`,

    fascicolo_tecnico: `Analizza questo Fascicolo Tecnico e restituisci in JSON:
{"data_compilazione":"YYYY-MM-DD","responsabile_compilazione":"nome"}
Rispondi SOLO con JSON valido.`,

    analisi_rischi: `Analizza questo documento di Analisi dei Rischi e restituisci in JSON:
{"metodologia":"ISO 12100:2010","data_valutazione":"YYYY-MM-DD","firmatario":"nome"}
Rispondi SOLO con JSON valido.`,

    schemi_elettrici: `Analizza questi Schemi Elettrici e restituisci in JSON:
{"standard_citato":"CEI EN 60204-1","versione":"v1.0","data_schemi":"YYYY-MM-DD"}
Rispondi SOLO con JSON valido.`,

    certificazione_componente: `Analizza questa Certificazione di Componente e restituisci in JSON:
{"componente":"nome componente","numero_certificato":"XXX","ente_certificatore":"ente","scadenza_certificato":"YYYY-MM-DD"}
Rispondi SOLO con JSON valido.`,

    bill_of_lading: `Analizza questo Bill of Lading e restituisci in JSON:
{"numero_bl":"XXX","data_bl":"YYYY-MM-DD","porto_carico":"es. CNSHG","porto_scarico":"es. ITGOA","peso_doc_kg":2800,"numero_colli":5,"codice_hs_nel_doc":"8477.80"}
Rispondi SOLO con JSON valido.`,

    fattura_commerciale: `Analizza questa Fattura Commerciale e restituisci in JSON:
{"numero_fattura":"INV-XXX","data_fattura":"YYYY-MM-DD","esportatore":"ragione sociale","importatore":"ragione sociale","valore_commerciale":85000,"valuta":"USD","codice_hs_nel_doc":"8477.80","descrizione_merce_doc":"descrizione"}
Rispondi SOLO con JSON valido.`,

    packing_list: `Analizza questa Packing List e restituisci in JSON:
{"numero_colli":5,"peso_doc_kg":2850,"peso_netto_kg":2700,"codice_hs_nel_doc":"8477.80"}
Rispondi SOLO con JSON valido.`,

    certificato_origine: `Analizza questo Certificato di Origine e restituisci in JSON:
{"paese_origine":"CN","numero_certificato":"XXX","data_certificato":"YYYY-MM-DD","ente_emittente":"Camera di Commercio di Shanghai"}
Rispondi SOLO con JSON valido.`,

    insurance_certificate: `Analizza questo Insurance Certificate e restituisci in JSON:
{"numero_polizza":"POL-XXX","valore_assicurato":90000,"valuta":"USD","data_copertura_da":"YYYY-MM-DD","data_copertura_a":"YYYY-MM-DD"}
Rispondi SOLO con JSON valido.`,
};
