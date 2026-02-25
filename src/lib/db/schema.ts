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
    created_by: uuid("created_by").references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── MACCHINARI ──────────────────────────────────────────────────────────────
export const macchinari = pgTable("macchinari", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pratica_id: uuid("pratica_id").references(() => pratiche.id, { onDelete: "cascade" }),
    nome_macchina: varchar("nome_macchina", { length: 255 }).notNull(),
    modello: varchar("modello", { length: 255 }).notNull(),
    anno_produzione: integer("anno_produzione"),
    numero_seriale: varchar("numero_seriale", { length: 255 }),
    stato_macchina: varchar("stato_macchina", { length: 20 }).notNull(), // nuova | usata
    potenza_kw: decimal("potenza_kw", { precision: 10, scale: 2 }),
    ha_sistemi_idraulici: boolean("ha_sistemi_idraulici").default(false),
    ha_sistemi_pneumatici: boolean("ha_sistemi_pneumatici").default(false),
    ha_automazioni_robot: boolean("ha_automazioni_robot").default(false),
    paese_destinazione: varchar("paese_destinazione", { length: 2 }).default("IT"),
    descrizione_tecnica: text("descrizione_tecnica"),
    funzione_principale: text("funzione_principale"),
    tipologia_lavorazione: text("tipologia_lavorazione"),
    codice_hs_suggerito: varchar("codice_hs_suggerito", { length: 10 }),
    codice_taric_selezionato: varchar("codice_taric_selezionato", { length: 10 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── DOCUMENTI CE ────────────────────────────────────────────────────────────
export const documenti_ce = pgTable("documenti_ce", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    macchinario_id: uuid("macchinario_id").references(() => macchinari.id, { onDelete: "cascade" }),
    tipo_documento: varchar("tipo_documento", { length: 100 }).notNull(),
    // dichiarazione_ce | manuale_uso | fascicolo_tecnico | schemi_elettrici | analisi_rischi | certificazione_componente
    nome_file: varchar("nome_file", { length: 255 }),
    url_storage: text("url_storage"),
    dimensione_bytes: decimal("dimensione_bytes", { precision: 20, scale: 0 }),
    stato_validazione: varchar("stato_validazione", { length: 50 }).default("da_verificare"),
    // da_verificare | valido | non_valido | attenzione
    anomalie_rilevate: jsonb("anomalie_rilevate").default([]),
    normativa_citata: varchar("normativa_citata", { length: 255 }),
    normativa_valida: boolean("normativa_valida"),
    data_documento: date("data_documento"),
    firmato: boolean("firmato").default(false),
    mandatario_ue: varchar("mandatario_ue", { length: 255 }),
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
    nome_file: varchar("nome_file", { length: 255 }),
    url_storage: text("url_storage"),
    dimensione_bytes: decimal("dimensione_bytes", { precision: 20, scale: 0 }),
    stato_validazione: varchar("stato_validazione", { length: 50 }).default("da_verificare"),
    anomalie_rilevate: jsonb("anomalie_rilevate").default([]),
    codice_hs_nel_doc: varchar("codice_hs_nel_doc", { length: 10 }),
    descrizione_merce_doc: text("descrizione_merce_doc"),
    quantita_doc: decimal("quantita_doc", { precision: 10, scale: 3 }),
    peso_doc_kg: decimal("peso_doc_kg", { precision: 10, scale: 3 }),
    valore_commerciale: decimal("valore_commerciale", { precision: 15, scale: 2 }),
    valuta: varchar("valuta", { length: 3 }).default("USD"),
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
export type DocumentoCE = typeof documenti_ce.$inferSelect;
export type NewDocumentoCE = typeof documenti_ce.$inferInsert;
export type DocumentoDoganale = typeof documenti_doganali.$inferSelect;
export type RiskScore = typeof risk_scores.$inferSelect;
export type AuditLog = typeof audit_log.$inferSelect;
