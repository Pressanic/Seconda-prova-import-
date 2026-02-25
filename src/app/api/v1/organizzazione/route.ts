export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = (session.user as any).organization_id;

    const [org] = await db.select().from(organizations).where(eq(organizations.id, org_id)).limit(1);
    if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(org);
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ruolo = (session.user as any).ruolo;
    if (ruolo !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const org_id = (session.user as any).organization_id;

    const body = await req.json();
    const [updated] = await db
        .update(organizations)
        .set({
            nome: body.nome,
            partita_iva: body.partita_iva,
            pec: body.pec ?? null,
            updated_at: new Date(),
        })
        .where(eq(organizations.id, org_id))
        .returning();

    return NextResponse.json(updated);
}
