"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "media";
const FOLDER = "uploads";
const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

export type StoredImage = { name: string; url: string };
export type UploadResult = { ok: true; url: string } | { ok: false; error: string };
export type DeleteResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function slugifyFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot === -1 ? name : name.slice(0, dot))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = dot === -1 ? "" : name.slice(dot).toLowerCase();
  return `${base || "bilde"}${ext}`;
}

export async function listBucketImages(): Promise<StoredImage[]> {
  if (!(await requireUser())) return [];

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).list(FOLDER, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error || !data) return [];

  return data
    .filter((item) => item.id !== null && IMAGE_RE.test(item.name))
    .map((item) => ({
      name: item.name,
      url: admin.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${item.name}`).data.publicUrl,
    }));
}

export async function uploadBucketImage(formData: FormData): Promise<UploadResult> {
  if (!(await requireUser())) return { ok: false, error: "Ikke innlogget." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Ingen fil valgt." };
  }
  if (!IMAGE_RE.test(file.name)) {
    return { ok: false, error: "Filtypen støttes ikke. Bruk PNG, JPG, WEBP, GIF, AVIF eller SVG." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Filen er for stor (maks 10 MB)." };
  }

  const admin = createAdminClient();
  const path = `${FOLDER}/${Date.now()}-${slugifyFilename(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return { ok: false, error: error.message };

  const url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return { ok: true, url };
}

export async function deleteBucketImage(name: string): Promise<DeleteResult> {
  if (!(await requireUser())) return { ok: false, error: "Ikke innlogget." };

  if (!name || name.includes("/") || name.includes("..") || !IMAGE_RE.test(name)) {
    return { ok: false, error: "Ugyldig filnavn." };
  }

  const admin = createAdminClient();
  const path = `${FOLDER}/${name}`;
  const { error } = await admin.storage.from(BUCKET).remove([path]);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
