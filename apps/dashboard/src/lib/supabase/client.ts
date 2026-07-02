import { createBrowserClient } from "@supabase/ssr";

// Auth-aware Supabase client for use in Client Components (e.g. the login form).
// It reads/writes the session via cookies so the server + middleware can see it.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
  );
}
