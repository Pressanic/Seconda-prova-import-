# Piano Operativo — Miglioramenti UX/AI
> Redatto: 2026-02-26 — Basato su analisi codebase esistente

---

## Obiettivo Generale

Semplificare e automatizzare il flusso di inserimento dati e documenti all'interno di una pratica, riducendo il lavoro manuale dell'operatore tramite estrazione automatica AI (Claude API) e form specifici per tipo di documento. L'utente mantiene sempre la responsabilità di verifica finale.

---

## Interventi in Ordine di Esecuzione

---

### FASE 1 — Quick Wins (nessuna dipendenza AI, nessuna migration DB)

#### 1.1 — Data prevista arrivo non obbligatoria

**Problema attuale:** Il wizard di creazione pratica tratta la data come obbligatoria a livello di form validation.

**Intervento:**
- File: `src/app/(app)/pratiche/nuova/page.tsx` — rimuovere la validazione required su `data_prevista_arrivo`
- Lasciare il campo con label "Data Prevista Arrivo *(consigliata)*"
- Schema DB: il campo `pratiche.data_prevista_arrivo` è già nullable, nessuna migration necessaria

**Avviso dashboard:**
- File: `src/app/(app)/dashboard/page.tsx` + API `GET /api/v1/dashboard/alert`
- Aggiungere un alert card visibile solo se una o più pratiche attive hanno `data_prevista_arrivo = NULL`
- Testo: *"N pratiche non hanno una data di arrivo prevista — [Completa ora →]"*
- Il link porta alla lista pratiche filtrata per `data_prevista_arrivo IS NULL`

---

#### 1.2 — Funzione principale: menu a tendina con auto-selezione

**Problema attuale:** Campo libero `funzione_principale` nel form macchinario — troppo aperto, dati inconsistenti.

**Intervento:**
- File: `src/app/(app)/pratiche/[id]/macchinario/page.tsx`
- Sostituire l'`<input>` con un `<select>` con le seguenti opzioni predefinite:

```
Lavorazione metalli (fresatura, tornitura, alesatura)
Lavorazione metalli (pressatura, stampaggio, imbutitura)
Taglio e deformazione lamiera
Saldatura e unione
Lavorazione legno (taglio, levigatura, foratura)
Assemblaggio e montaggio
Imballaggio e confezionamento
Trasporto e movimentazione interna
Stampa, incisione e marcatura
Trattamento superfici (verniciatura, sabbiatura)
Lavorazione plastica e gomma
Processo chimico o farmaceutico
Controllo qualità e misura
Altro (specificare in descrizione tecnica)
```

**Auto-selezione:** quando l'utente compila `descrizione_tecnica`, dopo il blur del campo, un semplice match per keyword (es. "pressa" → "Pressatura", "saldatur" → "Saldatura") pre-seleziona la voce più probabile. L'utente può cambiarla. Nessuna chiamata API — tutto client-side.

---

#### 1.3 — Box dimensioni macchinario

**Problema attuale:** Il form macchinario non ha campi per le dimensioni fisiche.

**Migration DB necessaria:**
```sql
-- Aggiungere a tabella macchinari
ALTER TABLE macchinari ADD COLUMN lunghezza_cm INTEGER;
ALTER TABLE macchinari ADD COLUMN larghezza_cm INTEGER;
ALTER TABLE macchinari ADD COLUMN altezza_cm INTEGER;
```
File schema: `src/lib/db/schema.ts` — aggiungere tre `integer()` nullable alla tabella `macchinari`
File migration: eseguire `npx drizzle-kit push` (già in uso nel progetto)

**Intervento form:**
- File: `src/app/(app)/pratiche/[id]/macchinario/page.tsx`
- Aggiungere sezione "Dimensioni Fisiche *(facoltative)*" con una griglia 3 colonne: L × P × H (cm)
- Aggiornare Zod schema, API GET/PUT endpoint
- Campi non obbligatori, nessun errore se vuoti

---

#### 1.4 — Upload overlay consistente (tutte le sezioni)

**Situazione attuale:**
- `CEDocumentUploadForm` ha già `fixed inset-0 bg-black/60 backdrop-blur-sm` — **corretto**
- `DoganaliUploadForm` — da verificare e allineare allo stesso pattern

**Intervento:**
- File: `src/components/forms/DoganaliUploadForm.tsx`
- Assicurarsi che quando `open === true` il modal sia `fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50`
- Il pulsante "Carica / Aggiorna" rimane inline nella riga documento, ma il modal è sempre a schermo intero con sfondo blurrato
- Stesso pattern da applicare al futuro modal di estrazione AI (vedi Fase 3)

---

### FASE 2 — Form Specifici per Tipo Documento (nessuna AI, solo UX)

Attualmente `CEDocumentUploadForm` e `DoganaliUploadForm` mostrano gli stessi campi indipendentemente dal tipo di documento. Questo va rifatto con form dedicati per tipo.

**Architettura:**
- Eliminare i form generici
- Creare un unico componente `DocumentUploadModal` parametrico che riceve `tipoDocumento` e renderizza i campi appropriati
- Struttura: `src/components/forms/DocumentUploadModal.tsx`

---

#### 2.1 — Documenti CE — campi specifici per tipo

| Tipo Documento | Campi Specifici |
|---|---|
| **Dichiarazione CE di Conformità** | `normativa_citata`, `data_documento`, `mandatario_ue`, `[check] normativa_vigente`, `[check] firmato` |
| **Manuale d'uso** | `lingua` (select: Italiano / Inglese / Multilingua), `versione`, `data_revisione`, `[check] lingua_italiana_presente` |
| **Fascicolo Tecnico** | `data_compilazione`, `responsabile_compilazione` |
| **Analisi dei Rischi** | `metodologia` (default: "ISO 12100:2010", editabile), `data_valutazione`, `firmatario` |
| **Schemi Elettrici** | `standard_citato` (default: "CEI EN 60204-1", editabile), `versione`, `data_schemi` |
| **Certificazioni Componenti** | `componente`, `numero_certificato`, `ente_certificatore`, `scadenza_certificato` |

**Campi extra in DB:** i campi specifici per tipo che non esistono ancora (`lingua`, `versione`, ecc.) vengono salvati nel campo `anomalie_rilevate` (JSONB) già esistente, con chiave `dati_extra: {...}`. Nessuna migration aggiuntiva.

**Validazione automatica lato client:**
- Manuale d'uso: se `lingua` ≠ "Italiano" o "Multilingua" → warning "Manuale non disponibile in italiano"
- Schemi Elettrici: se `standard_citato` non contiene "60204" → warning "Standard non standard CE"
- Certificazioni: se `scadenza_certificato` < oggi → warning "Certificato scaduto"

---

#### 2.2 — Documenti Doganali — campi specifici per tipo

| Tipo Documento | Campi Specifici |
|---|---|
| **Bill of Lading** | `numero_bl`, `data_bl`, `porto_carico`, `porto_scarico`, `peso_doc_kg`, `numero_colli`, `codice_hs_nel_doc` |
| **Fattura Commerciale** | `numero_fattura`, `data_fattura`, `esportatore`, `importatore`, `valore_commerciale`, `valuta`, `codice_hs_nel_doc`, `descrizione_merce_doc` |
| **Packing List** | `numero_colli`, `peso_doc_kg` (lordo), `peso_netto_kg` (nuovo campo JSONB), `codice_hs_nel_doc` |
| **Certificato di Origine** | `paese_origine`, `numero_certificato`, `data_certificato`, `ente_emittente` |
| **Insurance Certificate** | `numero_polizza`, `valore_assicurato`, `valuta`, `data_copertura_da`, `data_copertura_a` |

**Nota:** i campi extra rispetto allo schema esistente (`numero_bl`, `porto_carico`, ecc.) vengono salvati nel campo `anomalie_rilevate` JSONB come `dati_extra`, senza migration. I campi già presenti nello schema (`peso_doc_kg`, `valore_commerciale`, `valuta`, `codice_hs_nel_doc`, `descrizione_merce_doc`) vengono salvati nelle colonne esistenti.

---

### FASE 3 — Integrazione AI: Estrazione Automatica Documenti

Questa è la fase più strutturale. Introduce il Claude API nel backend per estrarre automaticamente i dati dai PDF caricati.

---

#### 3.1 — Setup dipendenze e configurazione

**Nuova dipendenza:**
```bash
npm install @anthropic-ai/sdk
```

**Nuova variabile d'ambiente:**
```
ANTHROPIC_API_KEY=sk-ant-...
```
Da aggiungere in `.env.local` e su Vercel → Settings → Environment Variables.

**Modello da usare:** `claude-haiku-4-5-20251001` — veloce, economico, ottimo per estrazione strutturata da PDF.

---

#### 3.2 — API route di estrazione

**Nuovo file:** `src/app/api/v1/extract-document/route.ts`

```
POST /api/v1/extract-document
Body: { file_base64: string, mime_type: string, tipo_documento: string }
Returns: { campi_estratti: { ... } }
```

**Logica:**
1. Riceve il file come base64 dal client
2. Costruisce il prompt specifico per tipo documento (vedi sotto)
3. Chiama Claude API con il documento come attachment (Claude supporta PDF nativamente)
4. Parsa la risposta JSON strutturata
5. Restituisce i campi estratti (tutti nullable — Claude potrebbe non trovarli tutti)

**Prompt per Dichiarazione CE:**
> *"Sei un esperto di conformità CE. Analizza questa dichiarazione di conformità CE e restituisci in JSON: normativa_citata (es. 'Reg. UE 2023/1230'), data_documento (ISO 8601), mandatario_ue (ragione sociale), nome_macchina, modello, numero_seriale, anno_produzione, firmato (true/false basato su presenza firma). Rispondi SOLO con JSON valido, nessun testo aggiuntivo."*

**Prompt per Bill of Lading:**
> *"Analizza questo Bill of Lading e restituisci in JSON: numero_bl, data_bl (ISO 8601), porto_carico, porto_scarico, peso_lordo_kg (numerico), numero_colli (intero), codice_hs (se presente). Solo JSON."*

*(Prompt analoghi per ogni tipo documento)*

---

#### 3.3 — Flusso UX nel modal di upload

Il modal di upload viene ridisegnato in **2 step** per ogni documento:

**Step 1 — Seleziona file:**
```
┌──────────────────────────────────────────┐
│  Carica Dichiarazione CE di Conformità   │
│                                          │
│  [ 📎 Seleziona PDF / trascina qui ]     │
│                                          │
│  [Annulla]          [Analizza Documento →]│
└──────────────────────────────────────────┘
```

**Step 2 — Verifica campi estratti (AI pre-compilato):**
```
┌──────────────────────────────────────────┐
│  ✓ Documento analizzato — verifica i dati│
│                                          │
│  Normativa citata   [Reg. UE 2023/1230 ] ← pre-filled
│  Data documento     [2024-03-15        ] ← pre-filled
│  Mandatario UE      [ABC Srl, Milano   ] ← pre-filled
│  ✓ Normativa vigente  ✓ Documento firmato│
│                                          │
│  ℹ️ Verifica i dati estratti prima di salvare│
│                                          │
│  [← Indietro]              [Salva →]     │
└──────────────────────────────────────────┘
```

Se l'estrazione fallisce o il PDF non è leggibile: step 2 mostra i campi **vuoti e editabili** con messaggio *"Estrazione non disponibile — compila manualmente"*.

---

#### 3.4 — Auto-compilazione dati macchinario da Dichiarazione CE

**Contesto:** quando l'utente carica la Dichiarazione CE nel form macchinario (non nella sezione CE compliance, ma direttamente nella scheda macchinario), il sistema può pre-compilare i campi del macchinario.

**Intervento nel form macchinario:**
- Aggiungere in cima al form una card "Carica Dichiarazione CE per auto-compilazione *(facoltativo)*"
- Upload PDF → chiamata a `/api/v1/extract-document` con `tipo_documento: "dichiarazione_ce"`
- I campi estratti (`nome_macchina`, `modello`, `numero_seriale`, `anno_produzione`, `normativa_citata`) appaiono in un banner di anteprima
- Pulsante "Applica questi dati" → popola i campi del form
- L'utente può modificarli liberamente prima di salvare
- Il documento stesso NON viene salvato qui — sarà caricato formalmente nella sezione CE Compliance

---

### FASE 4 — Avvisi Dashboard Avanzati

Una volta implementate le fasi precedenti, la dashboard diventa più informativa.

**Alert da aggiungere** (in ordine di priorità visiva):

| Condizione | Messaggio | Azione |
|---|---|---|
| Pratiche senza `data_prevista_arrivo` | "N pratiche senza data arrivo" | → lista pratiche filtrata |
| Macchinari senza dimensioni | "N macchinari senza dimensioni fisiche" | → scheda macchinario |
| Documenti CE obbligatori mancanti | "N pratiche con documenti CE incompleti" | → sezione CE |
| Documenti doganali obbligatori mancanti | "N pratiche con documenti doganali incompleti" | → sezione doganale |

Gli alert esistenti (`/api/v1/dashboard/alert`) vengono estesi con queste nuove query.

---

## Schema Modifiche DB — Riepilogo

| Tabella | Modifica | Tipo |
|---|---|---|
| `macchinari` | Aggiunte: `lunghezza_cm`, `larghezza_cm`, `altezza_cm` (integer, nullable) | Migration richiesta |
| `pratiche` | `data_prevista_arrivo` già nullable — nessuna modifica | — |
| `documenti_ce` | Nessuna modifica — dati extra in JSONB `anomalie_rilevate.dati_extra` | — |
| `documenti_doganali` | Nessuna modifica — dati extra in JSONB `anomalie_rilevate.dati_extra` | — |

**Totale migration necessarie: 1** (aggiunta colonne dimensioni a `macchinari`)

---

## Nuovi File da Creare

| File | Descrizione |
|---|---|
| `src/app/api/v1/extract-document/route.ts` | API estrazione AI (Claude) |
| `src/components/forms/DocumentUploadModal.tsx` | Modal upload unificato con step 1/2 e campi per tipo |
| `src/lib/ai/prompts.ts` | Prompt Claude per ogni tipo documento |

## File Esistenti da Modificare

| File | Modifica |
|---|---|
| `src/lib/db/schema.ts` | + 3 colonne dimensioni a `macchinari` |
| `src/app/(app)/pratiche/nuova/page.tsx` | Data arrivo non obbligatoria |
| `src/app/(app)/pratiche/[id]/macchinario/page.tsx` | + dimensioni, + funzione dropdown, + CE upload auto-fill |
| `src/app/(app)/pratiche/[id]/compliance-ce/page.tsx` | Usa `DocumentUploadModal` al posto di `CEDocumentUploadForm` |
| `src/app/(app)/pratiche/[id]/documenti-doganali/page.tsx` | Usa `DocumentUploadModal` al posto di `DoganaliUploadForm` |
| `src/app/(app)/dashboard/page.tsx` | + alert data arrivo mancante |
| `src/app/api/v1/dashboard/alert/route.ts` | + query date mancanti |
| `src/components/forms/CEDocumentUploadForm.tsx` | Deprecato → sostituito da `DocumentUploadModal` |
| `src/components/forms/DoganaliUploadForm.tsx` | Deprecato → sostituito da `DocumentUploadModal` |

---

## Ordine Esecuzione Consigliato

```
FASE 1 (Quick wins — nessun blocco tecnico)
  1.1 → Data arrivo opzionale + alert dashboard
  1.2 → Funzione principale dropdown
  1.3 → Dimensioni macchinario (unica migration)
  1.4 → Overlay upload consistente

FASE 2 (Form specifici — nessuna AI, massimo impatto UX)
  2.1 → DocumentUploadModal CE con campi per tipo
  2.2 → DocumentUploadModal Doganale con campi per tipo

FASE 3 (AI — dipende da Fase 2 per il modal)
  3.1 → Setup Anthropic SDK + env var
  3.2 → API /extract-document
  3.3 → Integrazione step 1→2 nel DocumentUploadModal
  3.4 → Auto-fill macchinario da CE declaration

FASE 4 (Dashboard — dipende da Fase 1 per la data)
  4.1 → Alert avanzati dashboard
```

---

## Note Tecniche

- **Claude + PDF nativi:** l'SDK `@anthropic-ai/sdk` supporta PDF come `document` con `source.type: "base64"` e `media_type: "application/pdf"` — nessuna libreria OCR aggiuntiva necessaria
- **Costo stimato per estrazione:** con `claude-haiku`, ogni analisi PDF ≈ $0.001–0.005 (1–5k token input)
- **Fallback:** se l'estrazione AI fallisce (PDF protetto, scan non leggibile, errore API), il modal mostra step 2 con campi vuoti e editabili — il flusso non si blocca mai
- **Nessuna rottura backward:** tutti i form esistenti continuano a funzionare durante la migrazione — `CEDocumentUploadForm` e `DoganaliUploadForm` vengono sostituiti gradualmente
