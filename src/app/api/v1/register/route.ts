import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
    nome: z.string().min(2),
    cognome: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
        }

        const { nome, cognome, email, password } = parsed.data;

        // Check email duplicata
        const [existing] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existing) {
            return NextResponse.json({ error: "Email già registrata" }, { status: 409 });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const [newUser] = await db
            .insert(users)
            .values({
                nome,
                cognome,
                email,
                password_hash,
                ruolo: "admin",
                attivo: true,
            })
            .returning({ id: users.id });

        return NextResponse.json({ id: newUser.id }, { status: 201 });
    } catch (e) {
        console.error("[register]", e);
        return NextResponse.json({ error: "Errore interno" }, { status: 500 });
    }
}
