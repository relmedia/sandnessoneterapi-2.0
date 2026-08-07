import "server-only";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Protection is active only when both halves are present: the secret so the
// server can verify, and the public site key so the browser can render a
// widget and produce a token in the first place.
export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET?.trim() && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET?.trim();
  // Fail closed: callers gate on isTurnstileConfigured(), so reaching this
  // without a secret means a misconfiguration, not an opt-out.
  if (!secret) return false;

  const trimmedToken = token.trim();
  if (!trimmedToken) return false;

  const params = new URLSearchParams({
    secret,
    response: trimmedToken,
  });

  if (remoteIp) {
    params.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Network error, non-2xx, or non-JSON body from siteverify. Fail closed.
    return false;
  }
}

// For endpoints that read the token straight off the request body instead of
// through a payload validator.
export function readTurnstileToken(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const value = (body as Record<string, unknown>).turnstileToken;
  return typeof value === "string" ? value.trim() : "";
}

export function getRequestIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }

  return request.headers.get("x-real-ip")?.trim() || undefined;
}
