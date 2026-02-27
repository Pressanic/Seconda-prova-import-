export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Read filename and content-type from headers (avoids req.formData() body-size limits)
    const contentType = req.headers.get("x-file-type") ?? req.headers.get("content-type") ?? "application/octet-stream";
    const rawFilename = req.headers.get("x-file-name") ?? "documento.pdf";
    const nome_file = decodeURIComponent(rawFilename);

    if (!ALLOWED_TYPES.includes(contentType)) {
        return NextResponse.json({ error: `Tipo file non supportato (ricevuto: ${contentType}, accettati: PDF, JPG, PNG)` }, { status: 400 });
    }

    if (!req.body) {
        return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
    }

    const org_id = (session.user as any).organization_id;
    const timestamp = Date.now();
    const safeName = nome_file.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `${org_id}/${timestamp}-${safeName}`;

    try {
        // Stream body directly to Vercel Blob — no in-memory buffering, no size pre-check
        const blob = await put(pathname, req.body, { access: "public", contentType });
        return NextResponse.json({
            url: blob.url,
            pathname: blob.pathname,
            size: 0,
            nome_file,
        });
    } catch (err: any) {
        console.error("[upload] Vercel Blob error:", err?.message, err?.status, err);
        return NextResponse.json({ error: err?.message ?? String(err) ?? "Errore upload storage" }, { status: 500 });
    }
}
