import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@supabase/supabase-js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT_PATTERN = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|uptime/i;

const SITE_HOSTNAMES = new Set(["sandnessoneterapi.no", "www.sandnessoneterapi.no", "localhost"]);

function createTrackingClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, { auth: { persistSession: false } });
}

// Anonymous visitor id: salted hash of IP + user agent that rotates daily,
// so no PII is stored and visitors cannot be tracked across days.
function computeVisitorHash(request: NextRequest, userAgent: string): string {
  const salt = process.env.ANALYTICS_SALT ?? process.env.SUPABASE_SECRET_KEY ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${salt}|${ip}|${userAgent}|${day}`).digest("hex").slice(0, 32);
}

// Vercel populates geo headers on every request; both are null when running
// locally or on another host.
function readGeo(request: NextRequest): { country: string | null; city: string | null } {
  const rawCountry = request.headers.get("x-vercel-ip-country");
  const country = rawCountry && /^[A-Z]{2}$/i.test(rawCountry) ? rawCountry.toUpperCase() : null;

  const rawCity = request.headers.get("x-vercel-ip-city");
  let city: string | null = null;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity).slice(0, 100);
    } catch {
      city = null;
    }
  }

  return { country, city };
}

function normalizeReferrer(referrer: unknown): string | null {
  if (typeof referrer !== "string" || referrer === "") return null;
  try {
    const hostname = new URL(referrer).hostname.replace(/^www\./, "");
    if (SITE_HOSTNAMES.has(hostname) || SITE_HOSTNAMES.has(`www.${hostname}`)) return null;
    return hostname.slice(0, 100);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (userAgent === "" || BOT_PATTERN.test(userAgent)) {
    return NextResponse.json({ ok: true });
  }

  let body: { path?: unknown; referrer?: unknown; sessionId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel." }, { status: 400 });
  }

  const { path, referrer, sessionId } = body;

  if (typeof path !== "string" || !path.startsWith("/") || path.length > 200) {
    return NextResponse.json({ error: "Ugyldig forespørsel." }, { status: 400 });
  }
  if (typeof sessionId !== "string" || !UUID_PATTERN.test(sessionId)) {
    return NextResponse.json({ error: "Ugyldig forespørsel." }, { status: 400 });
  }

  const supabase = createTrackingClient();
  if (!supabase) {
    return NextResponse.json({ ok: true });
  }

  // Strip query strings and fragments so only the pathname is stored.
  const cleanPath = path.split("?")[0].split("#")[0];
  const { country, city } = readGeo(request);

  await supabase.from("page_views").insert({
    path: cleanPath,
    referrer: normalizeReferrer(referrer),
    visitor_hash: computeVisitorHash(request, userAgent),
    session_id: sessionId,
    country,
    city,
  });

  return NextResponse.json({ ok: true });
}
