import { auth } from "@/lib/auth";
import { BillingContent } from "./_BillingContent";

export default async function BillingPage() {
    const session = await auth();
    const user = session?.user as any;
    const orgId: string | null = user?.organization_id ?? null;
    const piano: string = user?.piano ?? "free";

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-white">Abbonamento</h2>
                <p className="text-sm text-slate-400 mt-0.5">Gestisci il piano della tua organizzazione</p>
            </div>
            <BillingContent orgId={orgId} piano={piano} />
        </div>
    );
}
