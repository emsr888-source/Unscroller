import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PUBLIC_APP_URL = (Deno.env.get("PUBLIC_APP_URL") ?? "https://unscroller.app").replace(/\/$/, "");
const SHARE_BUCKET = Deno.env.get("CHALLENGE_SHARE_BUCKET") ?? "challenge-assets";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
}

const buildCaption = (title: string, commitments: string[]): string => {
  const snippet = commitments.filter(Boolean).slice(0, 2).join(" • ");
  return snippet
    ? `Join me in “${title}” on Unscroller! ${snippet}`
    : `Join me in “${title}” on Unscroller! Let’s keep each other accountable.`;
};

const buildSvgCard = (input: {
  title: string;
  description: string;
  coverEmoji?: string | null;
  durationLabel: string;
  shareUrl: string;
  commitments: string[];
}) => {
  const emoji = input.coverEmoji?.trim() || "🎯";
  const commitments = input.commitments.filter(Boolean).slice(0, 3);
  const commitmentsMarkup = commitments
    .map(item => `<li>${item.replace(/</g, "&lt;")}</li>`) // basic escaping
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FDE68A" />
        <stop offset="100%" stop-color="#FCA5A5" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" rx="48" fill="url(#bg)" />
    <rect x="48" y="48" width="1104" height="534" rx="36" fill="#fff" stroke="#0f172a" stroke-width="4" />
    <text x="96" y="150" font-size="80" font-family="Inter, sans-serif">${emoji}</text>
    <text x="96" y="230" font-size="48" font-weight="700" font-family="Inter, sans-serif" fill="#0f172a">${
      input.title.replace(/</g, "&lt;")
    }</text>
    <text x="96" y="280" font-size="28" font-family="Inter, sans-serif" fill="#475569">${
      input.description.replace(/</g, "&lt;")
    }</text>
    <text x="96" y="340" font-size="26" font-family="Inter, sans-serif" fill="#0f172a">${
      input.durationLabel.replace(/</g, "&lt;")
    }</text>
    <foreignObject x="96" y="360" width="1008" height="160">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:24px;color:#0f172a;font-family:Inter,sans-serif;line-height:1.6;">
        <ul style="margin:0;padding-left:24px;">${commitmentsMarkup}</ul>
      </div>
    </foreignObject>
    <text x="96" y="560" font-size="24" font-family="Inter, sans-serif" fill="#0f172a">${input.shareUrl}</text>
  </svg>`;
};

const getDurationLabel = (start: string, end: string) => {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
    return `${formatter.format(startDate)} → ${formatter.format(endDate)}`;
  } catch {
    return "Custom timeframe";
  }
};

Deno.serve(async req => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Missing x-tenant-id header" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { challengeId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const challengeId = body.challengeId;
  if (!challengeId) {
    return new Response(JSON.stringify({ error: "challengeId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: {
      headers: {
        "x-tenant-id": tenantId,
      },
    },
  });

  const { data: challenge, error: fetchError } = await supabase
    .from("challenges")
    .select(
      "id, title, description, cover_emoji, share_slug, share_asset_url, start_date, end_date, daily_commitments, weekly_commitments, success_metrics"
    )
    .eq("id", challengeId)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !challenge) {
    return new Response(JSON.stringify({ error: "Challenge not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let shareSlug = challenge.share_slug;
  if (!shareSlug) {
    shareSlug = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    await supabase
      .from("challenges")
      .update({ share_slug: shareSlug })
      .eq("id", challengeId)
      .eq("tenant_id", tenantId);
  }

  const shareUrl = `${PUBLIC_APP_URL}/c/${shareSlug}`;
  const caption = buildCaption(
    challenge.title,
    (challenge.daily_commitments as string[] | null) ?? []
  );

  const durationLabel = getDurationLabel(challenge.start_date, challenge.end_date);
  const commitments =
    (challenge.daily_commitments as string[] | null)?.length
      ? (challenge.daily_commitments as string[])
      : (challenge.weekly_commitments as string[] | null) ?? [];

  const svg = buildSvgCard({
    title: challenge.title,
    description: challenge.description ?? "",
    coverEmoji: challenge.cover_emoji,
    durationLabel,
    shareUrl,
    commitments,
  });

  const objectPath = `tenants/${tenantId}/challenges/${challengeId}.svg`;
  const svgBytes = new TextEncoder().encode(svg);

  const { error: uploadError } = await supabase.storage
    .from(SHARE_BUCKET)
    .upload(objectPath, svgBytes, { upsert: true, contentType: "image/svg+xml" });

  if (uploadError) {
    return new Response(JSON.stringify({ error: "Failed to store share card" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(SHARE_BUCKET)
    .createSignedUrl(objectPath, 60 * 60 * 24 * 30);

  if (signedUrlError || !signedUrlData) {
    return new Response(JSON.stringify({ error: "Failed to sign share card" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  await supabase
    .from("challenges")
    .update({ share_asset_url: signedUrlData.signedUrl, share_card_generated_at: new Date().toISOString() })
    .eq("id", challengeId)
    .eq("tenant_id", tenantId);

  return new Response(
    JSON.stringify({
      shareUrl,
      caption,
      imageUrl: signedUrlData.signedUrl,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});
