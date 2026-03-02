import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const orgId = (session.user as any).organization_id;
    if (!orgId) {
        return NextResponse.json({ error: "Nessuna organizzazione associata" }, { status: 400 });
    }

    const [org] = await db
        .select({ stripe_customer_id: organizations.stripe_customer_id })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

    if (!org?.stripe_customer_id) {
        return NextResponse.json({ error: "Nessun abbonamento attivo" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: org.stripe_customer_id,
        return_url: `${appUrl}/impostazioni/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
}
