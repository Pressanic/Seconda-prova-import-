# ImportCompliance — Stato Avanzamento Lavori

> Aggiornato: 2026-02-25 — Sessione 2

---

## Riepilogo Generale

| Fase | Titolo | Stato |
|------|--------|-------|
| 1 | Project Setup | ✅ Completata |
| 2 | Database Schema | ✅ Completata |
| 3 | Auth & Layout | ✅ Completata |
| 4 | Dashboard | ✅ Completata |
| 5 | Pratiche (Import Dossiers) | ✅ Completata |
| 6 | Machinery (Macchinari) | ✅ Completata |
| 7 | CE Compliance | ✅ Completata |
| 8 | Notified Body Verification | ✅ Completata |
| 9 | Customs (Doganale) | ✅ Completata |
| 10 | Risk Score Engine | ✅ Completata |
| 11 | Report PDF | ✅ Completata |
| 12 | Settings & Admin | ✅ Completata |
| 13 | Verifica Finale | ⏳ Da fare |

---

## Dettaglio per Fase

### Phase 1 — Project Setup ✅
- [x] Piano implementazione
- [x] Next.js 14+ con App Router
- [x] TailwindCSS 4
- [x] NeonDB + Drizzle ORM
- [x] NextAuth.js v5
- [x] Variabili d'ambiente (.env.local)
- [x] Dipendenze configurate (zod, react-hook-form, tanstack-query, lucide-react, recharts, @react-pdf/renderer)

### Phase 2 — Database Schema ✅
- [x] Schema organizations, users, pratiche, macchinari
- [x] Schema documenti_ce, organismi_notificati, classificazioni_hs
- [x] Schema documenti_doganali, risk_scores, audit_log
- [x] Migration generata e push a NeonDB
- [x] Seed dati iniziali (admin@demo.it / Admin123!)

### Phase 3 — Auth & Layout ✅
- [x] NextAuth.js credentials provider con bcrypt
- [x] Login page (`/login`) — UI dark moderna
- [x] Sidebar con navigazione e filtro per ruolo
- [x] Topbar con dropdown utente e logout
- [x] Middleware role-based access control

### Phase 4 — Dashboard ✅
- [x] Pagina `/dashboard` con KPI cards
- [x] Tabella pratiche recenti con status badge
- [x] API `/api/v1/dashboard/stats`
- [x] API `/api/v1/dashboard/alert`
- **Note:** Chart Recharts presente ma dati live da API

### Phase 5 — Pratiche ✅
- [x] Lista pratiche `/pratiche` con ricerca e filtri
- [x] Wizard creazione pratica `/pratiche/nuova` (2 step)
- [x] Layout tab navigazione `/pratiche/[id]/layout.tsx`
- [x] Overview pratica `/pratiche/[id]`
- [x] API CRUD `GET/POST /api/v1/pratiche`

### Phase 6 — Machinery ✅
- [x] Form macchinario `/pratiche/[id]/macchinario`
- [x] API endpoint `/api/v1/pratiche/[id]/macchinario`
- [x] Business rules: stato usata, automazioni_robot

### Phase 7 — CE Compliance ✅
- [x] Pagina gestione documenti CE `/pratiche/[id]/compliance-ce`
- [x] Upload documenti con simulazione storage
- [x] Logica validazione (presenza, normativa, firma, mandatario UE)
- [x] Checklist tecnica con stato per documento
- [x] Calcolo CE score (presente nella pagina)
- [x] API endpoint `/api/v1/pratiche/[id]/documenti-ce`
- [x] CEDocumentUploadForm modale con tutti i campi

### Phase 8 — Notified Body Verification ✅
- [x] Schema DB `organismi_notificati`
- [x] Display NB nel riepilogo di compliance-ce
- [x] Pagina dedicata `/pratiche/[id]/compliance-ce/organismo`
- [x] API `GET/POST /api/v1/pratiche/[id]/organismo-notificato`
- [x] Logica verifica NANDO simulata — 15 NB noti in DB locale
- [x] Stati: `valido` / `non_trovato` / `non_autorizzato`
- [x] Impatto score già nel risk engine (CE-NB-001/002/003)

### Phase 9 — Customs (Doganale) ✅
- [x] Pagina classificazione HS `/pratiche/[id]/classificazione-hs`
- [x] Widget HS con algoritmo rule-based e match percentuale
- [x] Display misure restrittive
- [x] Pagina documenti doganali `/pratiche/[id]/documenti-doganali`
- [x] Controlli coerenza cross-documento (nel risk engine)
- [x] Risk score doganale (nel risk engine)
- [x] API `/api/v1/pratiche/[id]/hs-suggestions`
- [x] API `/api/v1/pratiche/[id]/hs-classification`
- [x] API `/api/v1/pratiche/[id]/documenti-doganali`

### Phase 10 — Risk Score Engine ✅
- [x] Engine globale: `(CE×0.55) + (Doganale×0.45)`
- [x] Tabella penalità con codici CE-* e DG-*
- [x] Pagina dettaglio `/pratiche/[id]/risk-score`
- [x] Raccomandazioni automatiche
- [x] API save `/api/v1/pratiche/[id]/risk-score/calculate`
- [x] `RecalculateButton` per persistenza

### Phase 11 — Report PDF ✅
- [x] `@react-pdf/renderer` installato
- [x] Componente PDF `src/components/pdf/ReportDocument.tsx` — 2 pagine A4
- [x] Pagina anteprima `/pratiche/[id]/report` — preview HTML + pulsante download
- [x] API `GET /api/v1/pratiche/[id]/report` — genera e restituisce PDF binario
- [x] Tab "Report PDF" aggiunto al layout pratica (`/pratiche/[id]/layout.tsx`)

### Phase 12 — Settings & Admin ✅
- [x] Settings hub `/impostazioni` con 4 card (org, utenti, profilo, audit log)
- [x] Gestione utenti `/impostazioni/utenti` — client component con invite, cambia ruolo, attiva/disattiva, elimina
- [x] Profilo `/impostazioni/profilo`
- [x] Audit log `/impostazioni/audit-log` (solo admin) — ultime 200 azioni
- [x] Form modifica organizzazione `/impostazioni/organizzazione` — ragione sociale, P.IVA, PEC
- [x] API `GET/PATCH /api/v1/organizzazione`
- [x] API `GET/POST /api/v1/utenti` + `PATCH/DELETE /api/v1/utenti/[id]`
- [x] Upload file reale via Vercel Blob — `POST /api/v1/upload`
- [x] CEDocumentUploadForm aggiornato con file picker reale
- [x] DoganaliUploadForm aggiornato con file picker reale

### Phase 13 — Verifica Finale ⏳
- [ ] Aggiungere `BLOB_READ_WRITE_TOKEN` su Vercel (necessario per upload file)
- [ ] Test endpoints API
- [ ] Test flusso auth
- [ ] Test wizard creazione pratica
- [ ] Test flusso compliance CE con upload file reale
- [ ] Test classificazione HS
- [ ] Test calcolo risk score
- [ ] Verifica responsive design

---

## File di Progetto

### Pagine implementate (17)
| Path | Stato |
|------|-------|
| `/login` | ✅ |
| `/dashboard` | ✅ |
| `/pratiche` | ✅ |
| `/pratiche/nuova` | ✅ |
| `/pratiche/[id]` | ✅ |
| `/pratiche/[id]/macchinario` | ✅ |
| `/pratiche/[id]/compliance-ce` | ✅ |
| `/pratiche/[id]/compliance-ce/organismo` | ✅ |
| `/pratiche/[id]/classificazione-hs` | ✅ |
| `/pratiche/[id]/documenti-doganali` | ✅ |
| `/pratiche/[id]/risk-score` | ✅ |
| `/pratiche/[id]/report` | ✅ |
| `/impostazioni` | ✅ |
| `/impostazioni/utenti` | ✅ |
| `/impostazioni/profilo` | ✅ |
| `/impostazioni/audit-log` | ✅ |

### API Routes implementate (10)
| Endpoint | Metodo | Stato |
|----------|--------|-------|
| `/api/auth/[...nextauth]` | GET/POST | ✅ |
| `/api/v1/dashboard/stats` | GET | ✅ |
| `/api/v1/dashboard/alert` | GET | ✅ |
| `/api/v1/pratiche` | GET/POST | ✅ |
| `/api/v1/pratiche/[id]/macchinario` | GET/POST | ✅ |
| `/api/v1/pratiche/[id]/documenti-ce` | GET/POST | ✅ |
| `/api/v1/pratiche/[id]/documenti-doganali` | GET/POST | ✅ |
| `/api/v1/pratiche/[id]/hs-suggestions` | POST | ✅ |
| `/api/v1/pratiche/[id]/hs-classification` | POST | ✅ |
| `/api/v1/pratiche/[id]/risk-score/calculate` | POST | ✅ |
| `/api/v1/pratiche/[id]/organismo-notificato` | GET/POST | ✅ |
| `/api/v1/pratiche/[id]/report` | GET | ✅ |

---

## Prossimi Step (in ordine di priorità)

1. **Phase 13** — Test e verifica finale di tutti i flussi
2. Form modifica organizzazione `/impostazioni` (backlog, link "#" ancora non funzionante)
3. Integrazione Vercel Blob storage reale per upload documenti

---

## Credenziali Demo
- **Admin:** admin@demo.it / Admin123!
- **Operatore:** operatore@demo.it / Oper123!
