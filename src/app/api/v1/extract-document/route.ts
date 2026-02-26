export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { EXTRACTION_PROMPTS } from "@/lib/ai/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({ error: "AI non configurata", campi_estratti: null }, { status: 503 });
    }

    try {
        const { file_base64, mime_type, tipo_documento } = await req.json();

        if (!file_base64 || !tipo_documento) {
            return NextResponse.json({ error: "file_base64 e tipo_documento richiesti" }, { status: 400 });
        }

        const prompt = EXTRACTION_PROMPTS[tipo_documento];
        if (!prompt) {
            return NextResponse.json({ error: "tipo_documento non supportato" }, { status: 400 });
        }

        const mediaType = (mime_type === "application/pdf" ? "application/pdf" : "image/jpeg") as "application/pdf" | "image/jpeg" | "image/png" | "image/gif" | "image/webp";

        const isPdf = mediaType === "application/pdf";

        const contentBlock = isPdf
            ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: file_base64 } }
            : { type: "image" as const, source: { type: "base64" as const, media_type: mediaType as "image/jpeg" | "image/png", data: file_base64 } };

        const messages = [{ role: "user" as const, content: [contentBlock as any, { type: "text" as const, text: prompt }] }];

        const response = isPdf
            ? await (client.beta.messages.create as any)({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 1024,
                betas: ["pdfs-2024-09-25"],
                messages,
            })
            : await client.messages.create({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 1024,
                messages,
            } as any);

        const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "{}";

        let campi_estratti: Record<string, any> = {};
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            campi_estratti = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch {
            campi_estratti = {};
        }

        // Remove null values
        Object.keys(campi_estratti).forEach(k => {
            if (campi_estratti[k] === null || campi_estratti[k] === undefined || campi_estratti[k] === "") {
                delete campi_estratti[k];
            }
        });

        return NextResponse.json({ campi_estratti });
    } catch (err: any) {
        console.error("[extract-document]", err);
        return NextResponse.json({ error: err.message ?? "Errore estrazione", campi_estratti: {} }, { status: 500 });
    }
}
