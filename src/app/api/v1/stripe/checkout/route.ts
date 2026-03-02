import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
    interval: z.enum(["monthly", "annual"]),
});

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const orgId = (session.user as any).organization_id;
    if (!orgId) {
        return NextResponse.json({ error: "Nessuna organizzazione associata al tuo account" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "interval mancante o non valido" }, { status: 400 });
    }

    const priceId = parsed.data.interval === "monthly"
        ? process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY
        : process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL;

    if (!priceId) {
        return NextResponse.json({ error: "Price ID non configurato" }, { status: 500 });
    }

    const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

    if (!org) {
        return NextResponse.json({ error: "Organizzazione non trovata" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    let customerId = org.stripe_customer_id;
    if (!customerId) {
        const customer = await getStripe().customers.create({
            email: session.user.email!,
            name: org.nome,
            metadata: { organization_id: orgId },
        });
        customerId = customer.id;
        await db
            .update(organizations)
            .set({ stripe_customer_id: customerId })
            .where(eq(organizations.id, orgId));
    }

    const checkoutSession = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/impostazioni/billing?success=1`,
        cancel_url: `${appUrl}/impostazioni/billing`,
        metadata: { organization_id: orgId },
    });

    return NextResponse.json({ url: checkoutSession.url });
}
