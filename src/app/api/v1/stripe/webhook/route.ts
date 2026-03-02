import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

const PROFESSIONAL_PRICE_IDS = new Set([
    process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
    process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
]);

function pianoFromPriceId(priceId: string): string {
    return PROFESSIONAL_PRICE_IDS.has(priceId) ? "professional" : "free";
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
        return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error("[stripe/webhook] Invalid signature:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const orgId = session.metadata?.organization_id;
                if (orgId && session.subscription) {
                    await db
                        .update(organizations)
                        .set({ stripe_subscription_id: session.subscription as string })
                        .where(eq(organizations.id, orgId));
                }
                break;
            }

            case "customer.subscription.updated": {
                const sub = event.data.object as Stripe.Subscription;
                const priceId = sub.items.data[0]?.price.id ?? "";
                const piano = pianoFromPriceId(priceId);
                const periodEnd = new Date(((sub as any).current_period_end as number) * 1000);

                await db
                    .update(organizations)
                    .set({
                        piano,
                        stripe_subscription_id: sub.id,
                        stripe_current_period_end: periodEnd,
                    })
                    .where(eq(organizations.stripe_customer_id, sub.customer as string));
                break;
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;
                await db
                    .update(organizations)
                    .set({
                        piano: "free",
                        stripe_subscription_id: null,
                        stripe_current_period_end: null,
                    })
                    .where(eq(organizations.stripe_customer_id, sub.customer as string));
                break;
            }

            default:
                break;
        }
    } catch (err) {
        console.error("[stripe/webhook] Handler error:", err);
        return NextResponse.json({ error: "Handler error" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
