export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
    password_attuale: z.string().min(1),
    password_nuova: z.string().min(8, "La password deve essere di almeno 8 caratteri"),
});

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user_id = (session.user as any).id;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, user_id)).limit(1);
    if (!user) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

    const valid = await bcrypt.compare(parsed.data.password_attuale, user.password_hash);
    if (!valid) {
        return NextResponse.json({ error: "Password attuale non corretta" }, { status: 400 });
    }

    const newHash = await bcrypt.hash(parsed.data.password_nuova, 12);
    await db.update(users).set({ password_hash: newHash }).where(eq(users.id, user_id));

    return NextResponse.json({ success: true });
}
