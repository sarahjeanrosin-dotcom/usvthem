import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { pdf, type DocumentProps } from "@react-pdf/renderer";
import { BattleCardDocument } from "@/components/pdf/battle-card-document";
import { createElement, type ReactElement } from "react";

export const maxDuration = 60;

async function fetchBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const b64 = Buffer.from(buffer).toString("base64");
    const mime = res.headers.get("content-type") ?? "image/png";
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { battle_card_id } = await request.json();
  if (!battle_card_id) {
    return NextResponse.json({ error: "battle_card_id required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch battle card
  const { data: card, error: cardError } = await admin
    .from("battle_cards")
    .select("*")
    .eq("id", battle_card_id)
    .single();

  if (cardError || !card) {
    return NextResponse.json({ error: "Battle card not found" }, { status: 404 });
  }

  // Fetch competitors
  const { data: competitors } = await admin
    .from("competitors")
    .select("id, name, logo_url")
    .in("id", card.competitor_ids);

  // Fetch Genea logo as base64 from the deployed app's public folder
  // PNG, not SVG — @react-pdf/renderer's Image component does not reliably render inline SVG
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://usvthem.netlify.app";
  const geneaLogo = await fetchBase64(`${appUrl}/genea-logo.png`);

  const competitorData = await Promise.all(
    (competitors ?? []).map(async (c) => ({
      name: c.name,
      logoBase64: c.logo_url ? await fetchBase64(c.logo_url) : null,
    }))
  );

  // Render PDF
  const doc = createElement(BattleCardDocument, {
    content: card.generated_content as Record<string, string>,
    decisionMaker: card.decision_maker,
    vertical: card.vertical,
    productCategory: card.product_category,
    generatedAt: new Date(card.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    competitors: competitorData,
    geneaLogoBase64: geneaLogo,
  }) as ReactElement<DocumentProps>;

  const pdfBuffer = await pdf(doc).toBuffer();

  // Upload to Supabase Storage
  const storagePath = `${user.id}/${battle_card_id}.pdf`;
  const { error: uploadError } = await admin.storage
    .from("battle-cards")
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get signed URL (24h)
  const { data: signedData } = await admin.storage
    .from("battle-cards")
    .createSignedUrl(storagePath, 86400);

  const pdfUrl = signedData?.signedUrl ?? null;

  // Save URL to battle card record
  await admin
    .from("battle_cards")
    .update({ pdf_url: pdfUrl })
    .eq("id", battle_card_id);

  return NextResponse.json({ pdf_url: pdfUrl });
}
