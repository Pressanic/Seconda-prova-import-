import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { classifyHS } from "@/lib/services/hs-classifier";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { descrizione, funzione, tipologia } = await req.json();
    const results = classifyHS({ descrizione, funzione, tipologia });
    return NextResponse.json({ results });
}
