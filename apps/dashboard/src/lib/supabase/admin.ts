import "server-only";

import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS — only ever use this on the server,
// inside actions that have already verified the caller is authenticated.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secret = process.env.SUPABASE_SECRET_KEY!;
  return createClient(url, secret, { auth: { persistSession: false } });
}
