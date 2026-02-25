import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
    console.log("🌱 Starting database seed...");

    // Create demo organization
    const [org] = await sql`
    INSERT INTO organizations (nome, partita_iva, pec, piano)
    VALUES ('ImportCompliance Demo Srl', '12345678901', 'demo@pec.importcompliance.it', 'professional')
    ON CONFLICT (partita_iva) DO NOTHING
    RETURNING id
  `;

    if (!org) {
        const [existing] = await sql`SELECT id FROM organizations WHERE partita_iva = '12345678901'`;
        console.log("Organization already exists:", existing.id);
        return;
    }

    console.log("✅ Organization created:", org.id);

    // Create admin user
    const adminHash = await bcrypt.hash("Admin123!", 10);
    await sql`
    INSERT INTO users (organization_id, nome, cognome, email, password_hash, ruolo)
    VALUES (${org.id}, 'Mario', 'Rossi', 'admin@demo.it', ${adminHash}, 'admin')
    ON CONFLICT (email) DO NOTHING
  `;
    console.log("✅ Admin user created: admin@demo.it / Admin123!");

    // Create operatore user
    const opHash = await bcrypt.hash("Oper123!", 10);
    await sql`
    INSERT INTO users (organization_id, nome, cognome, email, password_hash, ruolo)
    VALUES (${org.id}, 'Giulia', 'Bianchi', 'operatore@demo.it', ${opHash}, 'operatore')
    ON CONFLICT (email) DO NOTHING
  `;
    console.log("✅ Operatore user created: operatore@demo.it / Oper123!");

    // Create demo pratica
    const [pratica] = await sql`
    INSERT INTO pratiche (organization_id, codice_pratica, nome_pratica, fornitore_cinese, stato, data_prevista_arrivo, created_by)
    SELECT ${org.id}, 'IMP-2026-0001', 'Pressa Iniezione HAITIAN MA4600', 'Haitian International Co. Ltd', 'in_lavorazione', '2026-03-15', u.id
    FROM users u WHERE u.email = 'admin@demo.it'
    ON CONFLICT (codice_pratica) DO NOTHING
    RETURNING id
  `;

    if (pratica) {
        console.log("✅ Demo pratica created:", pratica.id);

        // Create demo macchinario
        const [macch] = await sql`
      INSERT INTO macchinari (pratica_id, nome_macchina, modello, anno_produzione, numero_seriale, stato_macchina, potenza_kw, ha_sistemi_idraulici, paese_destinazione, descrizione_tecnica, funzione_principale)
      VALUES (${pratica.id}, 'Pressa a Iniezione', 'HAITIAN MA4600', 2025, 'SN-MA4600-2025-001', 'nuova', 45.5, true, 'IT', 'Pressa a iniezione per lavorazione plastica con sistema idraulico a 4 stazioni. Capacità 4600 kN. Sistema di controllo CNC integrato.', 'Stampaggio iniezione materie plastiche')
      RETURNING id
    `;
        console.log("✅ Demo macchinario created:", macch?.id);
    }

    console.log("\n🎉 Seed completed successfully!\n");
    console.log("Login credentials:");
    console.log("  Admin:     admin@demo.it     / Admin123!");
    console.log("  Operatore: operatore@demo.it  / Oper123!");
}

seed().catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
});
