import { pgTable, uuid, varchar, text, boolean, integer, decimal, date, timestamp, jsonb, inet } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// ─── ORGANIZATIONS ───────────────────────────────────────────────────────────
export const organizations = pgTable("organizations", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    nome: varchar("nome", { length: 255 }).notNull(),
    partita_iva: varchar("partita_iva", { length: 11 }).notNull().unique(),
    pec: varchar("pec", { length: 255 }),
    piano: varchar("piano", { length: 50 }).default("free").notNull(), // free | professional | enterprise
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    organization_id: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    nome: varchar("nome", { length: 255 }).notNull(),
    cognome: varchar("cognome", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password_hash: text("password_hash").notNull(),
    ruolo: varchar("ruolo", { length: 50 }).notNull(), // admin | operatore | consulente
    attivo: boolean("attivo").default(true),
    last_login: timestamp("last_login", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── PRATICHE ────────────────────────────────────────────────────────────────
export const pratiche = pgTable("pratiche", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    organization_id: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    codice_pratica: varchar("codice_pratica", { length: 50 }).notNull().unique(),
    nome_pratica: varchar("nome_pratica", { length: 255 }).notNull(),
    fornitore_cinese: varchar("fornitore_cinese", { length: 255 }),
    stato: varchar("stato", { length: 50 }).default("bozza").notNull(),
    // bozza | in_lavorazione | in_revisione | approvata | bloccata
    note: text("note"),
    data_prevista_arrivo: date("data_prevista_arrivo"),
    data_sdoganamento: date("data_sdoganamento"),
    // ─── Dati doganali pratica ───────────────────────────────────────────────
    eori_importatore: varchar("eori_importatore", { length: 20 }),
    // EORI obbligatorio per qualsiasi dichiarazione doganale UE
    incoterms: varchar("incoterms", { length: 10 }),
    // FOB | CIF | DAP | DDP | EXW — determina la base imponibile doganale
    porto_arrivo: varchar("porto_arrivo", { length: 100 }),
    // es. Genova, Trieste, La Spezia
    spedizioniere: varchar("spedizioniere", { length: 255 }),
    mrn_doganale: varchar("mrn_doganale", { length: 50 }),
    // Movement Reference Number — generato dalla dogana a sdoganamento completato
    // ─────────────────────────────────────────────────────────────────────────
    created_by: uuid("created_by").references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── MACCHINARI ──────────────────────────────────────────────────────────────
export const macchinari = pgTable("macchinari", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pratica_id: uuid("pratica_id").references(() => pratiche.id, { onDelete: "cascade" }),
    // ─── Identificazione ─────────────────────────────────────────────────────
    nome_macchina: varchar("nome_macchina", { length: 255 }).notNull(),
    marca: varchar("marca", { length: 255 }),
    // es. Haitian, Engel, Arburg, Fanuc — compare in ogni documento
    modello: varchar("modello", { length: 255 }).notNull(),
    anno_produzione: integer("anno_produzione"),
    numero_seriale: varchar("numero_seriale", { length: 255 }),
    stato_macchina: varchar("stato_macchina", { length: 20 }).notNull(), // nuova | usata
    // ─── Specifiche tecniche principali ──────────────────────────────────────
    tipo_azionamento: varchar("tipo_azionamento", { length: 20 }),
    // idraulico | elettrico | ibrido — sostituisce ha_sistemi_idraulici
    forza_chiusura_kn: decimal("forza_chiusura_kn", { precision: 10, scale: 2 }),
    // LA specifica principale di una pressa ad iniezione — es. 500t = 4905 kN
    potenza_kw: decimal("potenza_kw", { precision: 10, scale: 2 }),
    tensione_alimentazione_v: integer("tensione_alimentazione_v"),
    // standard EU: 400V
    // ─── Specifiche tecniche secondarie ──────────────────────────────────────
    volume_iniezione_cm3: decimal("volume_iniezione_cm3", { precision: 10, scale: 2 }),
    diametro_vite_mm: decimal("diametro_vite_mm", { precision: 8, scale: 2 }),
    distanza_colonne_mm: decimal("distanza_colonne_mm", { precision: 8, scale: 2 }),
    // distanza tra le colonne — determina dimensione massima stampo
    pressione_iniezione_bar: decimal("pressione_iniezione_bar", { precision: 8, scale: 2 }),
    // ─── Dimensioni e peso (per dogana) ──────────────────────────────────────
    peso_lordo_kg: decimal("peso_lordo_kg", { precision: 10, scale: 2 }),
    // CRITICO: cross-check con BL e packing list
    peso_netto_kg: decimal("peso_netto_kg", { precision: 10, scale: 2 }),
    numero_colli_macchina: integer("numero_colli_macchina"),
    lunghezza_cm: integer("lunghezza_cm"),
    larghezza_cm: integer("larghezza_cm"),
    altezza_cm: integer("altezza_cm"),
    // ─── Note tecniche ───────────────────────────────────────────────────────
    robot_estrazione_integrato: boolean("robot_estrazione_integrato").default(false),
    // robot di estrazione integrato nella fornitura
    sistemi_pneumatici_ausiliari: boolean("sistemi_pneumatici_ausiliari").default(false),
    descrizione_tecnica: text("descrizione_tecnica"),
    funzione_principale: text("funzione_principale"),
    // ─── Classificazione ─────────────────────────────────────────────────────
    codice_hs_suggerito: varchar("codice_hs_suggerito", { length: 10 }),
    codice_taric_selezionato: varchar("codice_taric_selezionato", { length: 10 }),
    // ─── Campi legacy (mantenuti per compatibilità — da rimuovere in v2) ─────
    ha_sistemi_idraulici: boolean("ha_sistemi_idraulici").default(false),
    ha_sistemi_pneumatici: boolean("ha_sistemi_pneumatici").default(false),
    ha_automazioni_robot: boolean("ha_automazioni_robot").default(false),
    paese_destinazione: varchar("paese_destinazione", { length: 2 }).default("IT"),
    tipologia_lavorazione: text("tipologia_lavorazione"),
    // ─────────────────────────────────────────────────────────────────────────
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── COMPONENTI AGGIUNTIVI ───────────────────────────────────────────────────
// Componentistica aggiuntiva inclusa nella fornitura (stampi, robot, ecc.)
export const componenti_aggiuntivi = pgTable("componenti_aggiuntivi", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    macchinario_id: uuid("macchinario_id").references(() => macchinari.id, { onDelete: "cascade" }).notNull(),
    // ─── Identificazione ─────────────────────────────────────────────────────
    descrizione: varchar("descrizione", { length: 255 }).notNull(),
    // es. "Robot di estrazione YUSHIN RG-125"
    marca: varchar("marca", { length: 255 }),
    modello: varchar("modello", { length: 255 }),
    numero_seriale: varchar("numero_seriale", { length: 255 }),
    // obbligatorio se ha marcatura CE propria
    // ─── Dati per dogana ─────────────────────────────────────────────────────
    quantita: integer("quantita").notNull().default(1),
    peso_kg: decimal("peso_kg", { precision: 10, scale: 2 }),
    // cross-check con BL e packing list
    valore_commerciale: decimal("valore_commerciale", { precision: 15, scale: 2 }),
    // cross-check con fattura commerciale
    valuta: varchar("valuta", { length: 3 }).default("EUR"),
    // ─── CE ──────────────────────────────────────────────────────────────────
    ha_marcatura_ce: boolean("ha_marcatura_ce").default(false),
    // se true → deve esistere dichiarazione CE per questo componente
    codice_hs_suggerito: varchar("codice_hs_suggerito", { length: 10 }),
    // es. 8479.50 per robot industriali, 8480.71 per stampi
    // ─────────────────────────────────────────────────────────────────────────
    note: text("note"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── DOCUMENTI CE ────────────────────────────────────────────────────────────
export const documenti_ce = pgTable("documenti_ce", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    macchinario_id: uuid("macchinario_id").references(() => macchinari.id, { onDelete: "cascade" }),
    tipo_documento: varchar("tipo_documento", { length: 100 }).notNull(),
    // dichiarazione_ce | manuale_uso | fascicolo_tecnico | analisi_rischi
    // schemi_elettrici | schemi_idraulici | schemi_pneumatici | certificazione_componente
    // ─── Struttura padre/figlio ───────────────────────────────────────────────
    parent_documento_id: uuid("parent_documento_id").references((): any => documenti_ce.id, { onDelete: "set null" }),
    // null = documento autonomo; valorizzato = sotto-documento del fascicolo tecnico
    // ─── Collegamento componente ──────────────────────────────────────────────
    componente_id: uuid("componente_id").references(() => componenti_aggiuntivi.id, { onDelete: "set null" }),
    // valorizzato se il documento CE si riferisce a un componente specifico
    // ─── File ─────────────────────────────────────────────────────────────────
    nome_file: varchar("nome_file", { length: 255 }),
    url_storage: text("url_storage"),
    dimensione_bytes: decimal("dimensione_bytes", { precision: 20, scale: 0 }),
    // ─── Validazione ──────────────────────────────────────────────────────────
    stato_validazione: varchar("stato_validazione", { length: 50 }).default("da_verificare"),
    // da_verificare | valido | non_valido | attenzione
    anomalie_rilevate: jsonb("anomalie_rilevate").default([]),
    // ─── Dati estratti / inseriti ─────────────────────────────────────────────
    normativa_citata: varchar("normativa_citata", { length: 255 }),
    norme_armonizzate: jsonb("norme_armonizzate").default([]),
    // array di norme citate nel documento — es. ["EN ISO 20430:2020", "ISO 12100:2010"]
    // EN ISO 20430:2020 è la norma specifica per presse ad iniezione plastica
    normativa_valida: boolean("normativa_valida"),
    data_documento: date("data_documento"),
    firmato: boolean("firmato").default(false),
    mandatario_ue: varchar("mandatario_ue", { length: 255 }),
    // ─────────────────────────────────────────────────────────────────────────
    uploaded_by: uuid("uploaded_by").references(() => users.id),
    uploaded_at: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
    verified_at: timestamp("verified_at", { withTimezone: true }),
});

// ─── ORGANISMI NOTIFICATI ────────────────────────────────────────────────────
export const organismi_notificati = pgTable("organismi_notificati", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    macchinario_id: uuid("macchinario_id").references(() => macchinari.id, { onDelete: "cascade" }),
    numero_organismo: varchar("numero_organismo", { length: 10 }).notNull(),
    nome_organismo: varchar("nome_organismo", { length: 255 }),
    stato_verifica: varchar("stato_verifica", { length: 50 }).default("non_verificato"),
    // non_verificato | valido | non_valido | non_trovato
    ambito_autorizzazione: text("ambito_autorizzazione"),
    nando_response: jsonb("nando_response"),
    verificato_at: timestamp("verificato_at", { withTimezone: true }),
    verificato_by: uuid("verificato_by").references(() => users.id),
});

// ─── CLASSIFICAZIONI HS ──────────────────────────────────────────────────────
export const classificazioni_hs = pgTable("classificazioni_hs", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    macchinario_id: uuid("macchinario_id").references(() => macchinari.id, { onDelete: "cascade" }),
    componente_id: uuid("componente_id").references(() => componenti_aggiuntivi.id, { onDelete: "cascade" }),
    // null = classificazione della macchina principale; valorizzato = classificazione componente
    codice_hs: varchar("codice_hs", { length: 6 }).notNull(),
    codice_taric: varchar("codice_taric", { length: 10 }),
    descrizione_hs: text("descrizione_hs"),
    misure_restrittive: jsonb("misure_restrittive").default([]),
    dazio_percentuale: decimal("dazio_percentuale", { precision: 5, scale: 2 }),
    iva_applicabile: decimal("iva_applicabile", { precision: 5, scale: 2 }),
    note_classificazione: text("note_classificazione"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── DOCUMENTI DOGANALI ──────────────────────────────────────────────────────
export const documenti_doganali = pgTable("documenti_doganali", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pratica_id: uuid("pratica_id").references(() => pratiche.id, { onDelete: "cascade" }),
    tipo_documento: varchar("tipo_documento", { length: 100 }).notNull(),
    // bill_of_lading | fattura_commerciale | packing_list | certificato_origine | insurance_certificate
    // ─── File ────────────────────────────────────────────────────────────────
    nome_file: varchar("nome_file", { length: 255 }),
    url_storage: text("url_storage"),
    dimensione_bytes: decimal("dimensione_bytes", { precision: 20, scale: 0 }),
    // ─── Validazione ─────────────────────────────────────────────────────────
    stato_validazione: varchar("stato_validazione", { length: 50 }).default("da_verificare"),
    anomalie_rilevate: jsonb("anomalie_rilevate").default([]),
    // ─── Dati estratti / inseriti ────────────────────────────────────────────
    codice_hs_nel_doc: varchar("codice_hs_nel_doc", { length: 10 }),
    descrizione_merce_doc: text("descrizione_merce_doc"),
    quantita_doc: decimal("quantita_doc", { precision: 10, scale: 3 }),
    peso_doc_kg: decimal("peso_doc_kg", { precision: 10, scale: 3 }),
    valore_commerciale: decimal("valore_commerciale", { precision: 15, scale: 2 }),
    valuta: varchar("valuta", { length: 3 }).default("USD"),
    // ─── Campi specifici per tipo documento ──────────────────────────────────
    tipo_bl: varchar("tipo_bl", { length: 20 }),
    // solo per bill_of_lading: obl | sea_waybill | express_bl
    incoterms_doc: varchar("incoterms_doc", { length: 10 }),
    // cross-check con pratica.incoterms
    numero_colli_doc: integer("numero_colli_doc"),
    // ─── Cross-check componenti ───────────────────────────────────────────────
    componenti_trovati: jsonb("componenti_trovati").default([]),
    // array di { componente_id, trovato: bool, confermato_manualmente: bool }
    // popolato dall'AI e/o confermato dall'utente
    // ─────────────────────────────────────────────────────────────────────────
    uploaded_by: uuid("uploaded_by").references(() => users.id),
    uploaded_at: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
});

// ─── RISK SCORES ──────────────────────────────────────────────────────────────
export const risk_scores = pgTable("risk_scores", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pratica_id: uuid("pratica_id").references(() => pratiche.id, { onDelete: "cascade" }),
    score_globale: integer("score_globale").notNull(),
    score_compliance_ce: integer("score_compliance_ce").notNull(),
    score_doganale: integer("score_doganale").notNull(),
    score_coerenza: integer("score_coerenza").notNull().default(100),
    // nuovo: misura la coerenza dei dati tra le sezioni (cross-check)
    livello_rischio: varchar("livello_rischio", { length: 20 }).notNull(), // basso | medio | alto | critico
    dettaglio_penalita: jsonb("dettaglio_penalita").notNull(),
    raccomandazioni: jsonb("raccomandazioni").default([]),
    calcolato_at: timestamp("calcolato_at", { withTimezone: true }).defaultNow(),
    calcolato_by: uuid("calcolato_by").references(() => users.id),
});

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────
export const audit_log = pgTable("audit_log", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    organization_id: uuid("organization_id").references(() => organizations.id),
    pratica_id: uuid("pratica_id").references(() => pratiche.id),
    user_id: uuid("user_id").references(() => users.id),
    azione: varchar("azione", { length: 255 }).notNull(),
    entita_tipo: varchar("entita_tipo", { length: 100 }),
    entita_id: uuid("entita_id"),
    dati_precedenti: jsonb("dati_precedenti"),
    dati_nuovi: jsonb("dati_nuovi"),
    ip_address: inet("ip_address"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── RELATIONS ────────────────────────────────────────────────────────────────
export const organizationsRelations = relations(organizations, ({ many }) => ({
    users: many(users),
    pratiche: many(pratiche),
}));

export const usersRelations = relations(users, ({ one }) => ({
    organization: one(organizations, { fields: [users.organization_id], references: [organizations.id] }),
}));

export const praticheRelations = relations(pratiche, ({ one, many }) => ({
    organization: one(organizations, { fields: [pratiche.organization_id], references: [organizations.id] }),
    created_by_user: one(users, { fields: [pratiche.created_by], references: [users.id] }),
    macchinario: one(macchinari, { fields: [pratiche.id], references: [macchinari.pratica_id] }),
    documenti_doganali: many(documenti_doganali),
    risk_scores: many(risk_scores),
    audit_logs: many(audit_log),
}));

export const macchinariRelations = relations(macchinari, ({ one, many }) => ({
    pratica: one(pratiche, { fields: [macchinari.pratica_id], references: [pratiche.id] }),
    documenti_ce: many(documenti_ce),
    organismi_notificati: many(organismi_notificati),
    classificazioni_hs: many(classificazioni_hs),
    componenti_aggiuntivi: many(componenti_aggiuntivi),
}));

export const componentiAggiuntiviRelations = relations(componenti_aggiuntivi, ({ one, many }) => ({
    macchinario: one(macchinari, { fields: [componenti_aggiuntivi.macchinario_id], references: [macchinari.id] }),
    documenti_ce: many(documenti_ce),
    classificazioni_hs: many(classificazioni_hs),
}));

export const documentiCeRelations = relations(documenti_ce, ({ one, many }) => ({
    macchinario: one(macchinari, { fields: [documenti_ce.macchinario_id], references: [macchinari.id] }),
    componente: one(componenti_aggiuntivi, { fields: [documenti_ce.componente_id], references: [componenti_aggiuntivi.id] }),
    parent: one(documenti_ce, { fields: [documenti_ce.parent_documento_id], references: [documenti_ce.id], relationName: "doc_parent" }),
    sub_documenti: many(documenti_ce, { relationName: "doc_parent" }),
}));

// ─── TYPE EXPORTS ────────────────────────────────────────────────────────────
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Pratica = typeof pratiche.$inferSelect;
export type NewPratica = typeof pratiche.$inferInsert;
export type Macchinario = typeof macchinari.$inferSelect;
export type NewMacchinario = typeof macchinari.$inferInsert;
export type ComponenteAggiuntivo = typeof componenti_aggiuntivi.$inferSelect;
export type NewComponenteAggiuntivo = typeof componenti_aggiuntivi.$inferInsert;
export type DocumentoCE = typeof documenti_ce.$inferSelect;
export type NewDocumentoCE = typeof documenti_ce.$inferInsert;
export type DocumentoDoganale = typeof documenti_doganali.$inferSelect;
export type RiskScore = typeof risk_scores.$inferSelect;
export type AuditLog = typeof audit_log.$inferSelect;
