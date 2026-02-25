export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ruolo = (session.user as any).ruolo;
    if (ruolo !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const org_id = (session.user as any).organization_id;

    const lista = await db.select({
        id: users.id,
        nome: users.nome,
        cognome: users.cognome,
        email: users.email,
        ruolo: users.ruolo,
        attivo: users.attivo,
        last_login: users.last_login,
        created_at: users.created_at,
    }).from(users).where(eq(users.organization_id, org_id));

    return NextResponse.json({ data: lista });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ruolo = (session.user as any).ruolo;
    if (ruolo !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const org_id = (session.user as any).organization_id;

    const body = await req.json();
    const { nome, cognome, email, ruolo: newRuolo, password } = body;

    if (!nome || !cognome || !email || !newRuolo || !password) {
        return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
        return NextResponse.json({ error: "Email già registrata" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
        organization_id: org_id,
        nome,
        cognome,
        email,
        password_hash: hash,
        ruolo: newRuolo,
        attivo: true,
    }).returning({
        id: users.id,
        nome: users.nome,
        cognome: users.cognome,
        email: users.email,
        ruolo: users.ruolo,
        attivo: users.attivo,
    });

    return NextResponse.json(newUser, { status: 201 });
}
