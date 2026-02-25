export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrgStats } from "@/lib/services/pratiche";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const org_id = (session.user as any).organization_id;
    if (!org_id) return NextResponse.json({ error: "No organization" }, { status: 403 });

    const stats = await getOrgStats(org_id);
    return NextResponse.json(stats);
}
