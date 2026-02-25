export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "File troppo grande (max 10 MB)" }, { status: 400 });
    }

    const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Tipo file non supportato (solo PDF, JPG, PNG)" }, { status: 400 });
    }

    const org_id = (session.user as any).organization_id;
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `${org_id}/${timestamp}-${safeName}`;

    const blob = await put(pathname, file, { access: "public" });

    return NextResponse.json({
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
        nome_file: file.name,
    });
}
