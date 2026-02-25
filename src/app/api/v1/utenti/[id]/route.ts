export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ruolo = (session.user as any).ruolo;
    if (ruolo !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const org_id = (session.user as any).organization_id;
    const current_user_id = (session.user as any).id;
    const { id } = await params;

    // Cannot modify yourself
    if (id === current_user_id) {
        return NextResponse.json({ error: "Non puoi modificare il tuo stesso account" }, { status: 400 });
    }

    // Verify user belongs to org
    const [target] = await db.select().from(users)
        .where(and(eq(users.id, id), eq(users.organization_id, org_id))).limit(1);
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const updates: Record<string, any> = {};

    if (body.ruolo !== undefined) updates.ruolo = body.ruolo;
    if (body.attivo !== undefined) updates.attivo = body.attivo;

    const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning({
            id: users.id,
            nome: users.nome,
            cognome: users.cognome,
            email: users.email,
            ruolo: users.ruolo,
            attivo: users.attivo,
        });

    return NextResponse.json(updated);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ruolo = (session.user as any).ruolo;
    if (ruolo !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const org_id = (session.user as any).organization_id;
    const current_user_id = (session.user as any).id;
    const { id } = await params;

    if (id === current_user_id) {
        return NextResponse.json({ error: "Non puoi eliminare il tuo account" }, { status: 400 });
    }

    const [target] = await db.select().from(users)
        .where(and(eq(users.id, id), eq(users.organization_id, org_id))).limit(1);
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ ok: true });
}
