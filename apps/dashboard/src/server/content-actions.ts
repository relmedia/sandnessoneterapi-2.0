"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { renderEmail } from "@repo/email";

import { getEmailSettings, getSettings } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

function strOrNull(formData: FormData, key: string): string | null {
  const value = str(formData, key);
  return value === "" ? null : value;
}

function intOrNull(formData: FormData, key: string): number | null {
  const value = str(formData, key);
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

const now = () => new Date().toISOString();

// ---------------- Services (Behandlinger) ----------------

export async function saveService(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return { ok: false, error: "Tittel er påkrevd." };

  const payload = {
    title,
    slug: str(formData, "slug") || slugify(title),
    short_description: strOrNull(formData, "short_description"),
    body: strOrNull(formData, "body"),
    image_url: strOrNull(formData, "image_url"),
    image_alt: strOrNull(formData, "image_alt"),
    order: intOrNull(formData, "order") ?? 0,
    updated_at: now(),
  };

  const { error } = id
    ? await supabase.from("services").update(payload).eq("id", id)
    : await supabase.from("services").insert({ id: randomUUID(), ...payload });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/behandlinger");
  return { ok: true };
}

export async function deleteService(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/behandlinger");
  return { ok: true };
}

// ---------------- Courses (Kurs) ----------------

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;

function parseSessions(formData: FormData): {
  start: string;
  end: string | null;
  start_time: string | null;
  end_time: string | null;
  capacity: number | null;
}[] {
  const raw = str(formData, "sessions");
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is { start: string; end?: string; start_time?: string; end_time?: string; capacity?: number } =>
          Boolean(row) && typeof row === "object" && ISO_DATE_PATTERN.test((row as { start?: unknown }).start as string),
      )
      .map((row) => ({
        start: row.start,
        end: typeof row.end === "string" && ISO_DATE_PATTERN.test(row.end) ? row.end : null,
        start_time: typeof row.start_time === "string" && TIME_PATTERN.test(row.start_time) ? row.start_time.slice(0, 5) : null,
        end_time: typeof row.end_time === "string" && TIME_PATTERN.test(row.end_time) ? row.end_time.slice(0, 5) : null,
        capacity:
          typeof row.capacity === "number" && Number.isFinite(row.capacity) && row.capacity > 0
            ? Math.floor(row.capacity)
            : null,
      }))
      .sort((a, b) => a.start.localeCompare(b.start));
  } catch {
    return [];
  }
}

export async function saveCourse(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return { ok: false, error: "Tittel er påkrevd." };

  const sessions = parseSessions(formData);

  const payload = {
    title,
    slug: str(formData, "slug") || slugify(title),
    // start/end mirror the first session so sorting and older code keep working.
    start_date: sessions[0]?.start ?? null,
    end_date: sessions[0]?.end ?? null,
    sessions,
    location: strOrNull(formData, "location"),
    price: intOrNull(formData, "price"),
    short_description: strOrNull(formData, "short_description"),
    body: strOrNull(formData, "body"),
    image_url: strOrNull(formData, "image_url"),
    active: bool(formData, "active"),
    updated_at: now(),
  };

  const write = (data: Partial<typeof payload>) =>
    id
      ? supabase.from("courses").update(data).eq("id", id)
      : supabase.from("courses").insert({ id: randomUUID(), ...data });

  let { error } = await write(payload);
  if (error && /sessions/i.test(error.message)) {
    // The sessions column hasn't been added yet (supabase/course-sessions.sql).
    const { sessions: _sessions, ...withoutSessions } = payload;
    void _sessions;
    ({ error } = await write(withoutSessions));
  }
  if (error && /image_url/i.test(error.message)) {
    const { image_url: _image, sessions: _sessions2, ...minimal } = payload;
    void _image;
    void _sessions2;
    ({ error } = await write(minimal));
  }

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/kurs");
  revalidatePath("/kurs");
  return { ok: true };
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/kurs");
  return { ok: true };
}

// ---------------- Site settings (Innstillinger) ----------------

export async function saveSettings(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const payload = {
    id: str(formData, "id") || "singleton",
    title: strOrNull(formData, "title"),
    tagline: strOrNull(formData, "tagline"),
    hero_heading: strOrNull(formData, "hero_heading"),
    hero_body: strOrNull(formData, "hero_body"),
    phone: strOrNull(formData, "phone"),
    email: strOrNull(formData, "email"),
    address: strOrNull(formData, "address"),
    nnh: bool(formData, "nnh"),
    facebook_url: strOrNull(formData, "facebook_url"),
    meta_description: strOrNull(formData, "meta_description"),
    updated_at: now(),
  };

  const { error } = await supabase.from("settings").upsert(payload, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/innstillinger");
  return { ok: true };
}

export async function saveEmailSettings(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const existing = await getEmailSettings();
  const apiKeyInput = str(formData, "resend_api_key");
  const clearApiKey = bool(formData, "clear_resend_api_key");

  const payload = {
    id: "singleton",
    resend_api_key: clearApiKey ? null : apiKeyInput || existing.resend_api_key,
    email_from: strOrNull(formData, "email_from"),
    booking_admin_email: strOrNull(formData, "booking_admin_email"),
    updated_at: now(),
  };

  const { error } = await supabase.from("email_settings").upsert(payload, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/innstillinger/e-post");
  return { ok: true };
}

export async function sendTestEmail(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Du må være innlogget for å sende test e-post." };

  const [existing, settings] = await Promise.all([getEmailSettings(), getSettings()]);
  const apiKey = str(formData, "resend_api_key") || existing.resend_api_key?.trim() || null;
  const from = str(formData, "email_from") || existing.email_from?.trim() || null;
  const to = str(formData, "test_email");

  if (!apiKey || !from) {
    return { ok: false, error: "Resend API-nøkkel og avsender må være satt før du kan sende test." };
  }
  if (!to) {
    return { ok: false, error: "Oppgi en e-postadresse som skal motta testen." };
  }

  const siteName = settings.title?.trim() || "Sandnes Soneterapi";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sandnessoneterapi.no").replace(/\/$/, "");

  const html = renderEmail({
    siteName,
    siteUrl,
    preheader: "Testmelding fra dashbordet – Resend er konfigurert riktig.",
    badge: { label: "Test", tone: "info" },
    heading: "Test e-post",
    intro: [
      "Dette er en testmelding sendt fra Sandnes Soneterapi-dashbordet.",
      "Hvis du mottar denne e-posten, er Resend konfigurert riktig.",
    ],
    detailTitle: "Innstillinger",
    detailRows: [
      { label: "Avsender", value: from },
      { label: "Mottaker", value: to },
    ],
    contact: {
      phone: settings.phone?.trim() || undefined,
      email: settings.email?.trim() || undefined,
      address: settings.address?.trim() || undefined,
      facebookUrl: settings.facebook_url?.trim() || undefined,
    },
    signoff: false,
  });

  const text =
    "Dette er en test fra Sandnes Soneterapi-dashbordet. Hvis du mottar denne meldingen, er Resend konfigurert riktig.";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "Test e-post – Sandnes Soneterapi",
        html,
        text,
      }),
    });

    const rawBody = await response.text();
    console.log(`[test-email] Resend status=${response.status} from=${from} to=${to} body=${rawBody}`);

    if (!response.ok) {
      let message = `Resend returnerte feil (${response.status}).`;
      try {
        const body = JSON.parse(rawBody) as { message?: string; name?: string };
        if (body.message) message = body.message;
      } catch {
        // ignore JSON parse errors
      }
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch (error) {
    console.error("[test-email] Send failed:", error);
    return { ok: false, error: "Kunne ikke sende test e-post. Sjekk nettverkstilkoblingen og prøv igjen." };
  }
}

// ---------------- Pages (Sider) ----------------

export async function savePage(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return { ok: false, error: "Tittel er påkrevd." };

  const slug = str(formData, "slug");
  const payload = {
    title,
    body: strOrNull(formData, "body"),
    updated_at: now(),
  };

  // The slug decides where the page shows on the website. When editing, an
  // empty slug field keeps the existing slug instead of regenerating it from
  // the title (which would silently unlink fixed pages like /foredrag).
  const { error } = id
    ? await supabase
        .from("pages")
        .update(slug ? { ...payload, slug } : payload)
        .eq("id", id)
    : await supabase.from("pages").insert({ id: randomUUID(), ...payload, slug: slug || slugify(title) });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/sider");
  return { ok: true };
}

export async function deletePage(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/sider");
  return { ok: true };
}

// ---------------- Books (Bøker) ----------------

export async function saveBook(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return { ok: false, error: "Tittel er påkrevd." };

  const payload = {
    title,
    slug: str(formData, "slug") || slugify(title),
    cover_image_url: strOrNull(formData, "cover_image_url"),
    isbn: strOrNull(formData, "isbn"),
    published_date: strOrNull(formData, "published_date"),
    price: intOrNull(formData, "price"),
    pages: intOrNull(formData, "pages"),
    description: strOrNull(formData, "description"),
    order: intOrNull(formData, "order") ?? 0,
    order_online: bool(formData, "order_online"),
    updated_at: now(),
  };

  const save = async (data: typeof payload) =>
    id
      ? supabase.from("books").update(data).eq("id", id)
      : supabase.from("books").insert({ id: randomUUID(), ...data });

  let { error } = await save(payload);
  if (error?.code === "42703") {
    const { order_online: _removed, ...withoutOrderOnline } = payload;
    ({ error } = await save(withoutOrderOnline as typeof payload));
  }

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/boker");
  return { ok: true };
}

export async function deleteBook(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/boker");
  return { ok: true };
}

// ---------------- Articles (Artikler) ----------------

export async function saveArticle(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return { ok: false, error: "Tittel er påkrevd." };

  const payload = {
    title,
    slug: str(formData, "slug") || slugify(title),
    published_at: strOrNull(formData, "published_at"),
    excerpt: strOrNull(formData, "excerpt"),
    cover_image_url: strOrNull(formData, "cover_image_url"),
    body: strOrNull(formData, "body"),
    updated_at: now(),
  };

  const { error } = id
    ? await supabase.from("articles").update(payload).eq("id", id)
    : await supabase.from("articles").insert({ id: randomUUID(), ...payload });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/artikler");
  return { ok: true };
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/artikler");
  return { ok: true };
}
