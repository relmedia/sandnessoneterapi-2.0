import "server-only";

import { createBookingClient } from "@/lib/booking-store";

export type ResolvedEmailConfig = {
  apiKey: string | null;
  from: string | null;
  adminEmail: string | null;
};

function fromEnv(): ResolvedEmailConfig {
  return {
    apiKey: process.env.RESEND_API_KEY?.trim() || null,
    from: process.env.EMAIL_FROM?.trim() || null,
    adminEmail: process.env.BOOKING_ADMIN_EMAIL?.trim() || null,
  };
}

export async function resolveEmailConfig(): Promise<ResolvedEmailConfig> {
  const fallback = fromEnv();
  const supabase = createBookingClient();
  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from("email_settings")
    .select("resend_api_key, email_from, booking_admin_email")
    .eq("id", "singleton")
    .maybeSingle();

  if (error || !data) return fallback;

  return {
    apiKey: data.resend_api_key?.trim() || fallback.apiKey,
    from: data.email_from?.trim() || fallback.from,
    adminEmail: data.booking_admin_email?.trim() || fallback.adminEmail,
  };
}

export async function isEmailConfigured(): Promise<boolean> {
  const config = await resolveEmailConfig();
  return Boolean(config.apiKey && config.from);
}
