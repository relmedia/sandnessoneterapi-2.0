import "server-only";

import { buildBookingConfirmedCustomerEmail } from "@repo/email/booking-emails";

import { getEmailSettings, getSettings } from "@/lib/content";

const SITE_NAME = "Sandnes Soneterapi";

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sandnessoneterapi.no").replace(/\/$/, "");
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return phone;
}

function formatDateNbLong(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface DashboardBookingEmailDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceLabel: string;
  date: string;
  time: string;
  message?: string | null;
  cancelToken: string;
  confirmToken: string;
}

export async function sendBookingConfirmedEmailFromDashboard(
  booking: DashboardBookingEmailDetails,
): Promise<boolean> {
  const [emailSettings, siteSettings] = await Promise.all([getEmailSettings(), getSettings()]);
  const apiKey = emailSettings.resend_api_key?.trim();
  const from = emailSettings.email_from?.trim();

  if (!apiKey || !from) {
    console.warn("[dashboard booking-email] Email not configured.");
    return false;
  }

  const siteName = siteSettings.title?.trim() || SITE_NAME;
  const siteUrl = getSiteUrl();
  const contact = {
    phone: siteSettings.phone?.trim() || undefined,
    email: siteSettings.email?.trim() || undefined,
    address: siteSettings.address?.trim() || undefined,
    facebookUrl: siteSettings.facebook_url?.trim() || undefined,
  };

  const email = buildBookingConfirmedCustomerEmail(
    { siteName, siteUrl, contact },
    {
      firstName: booking.firstName,
      serviceLabel: booking.serviceLabel,
      dateLabel: formatDateNbLong(booking.date),
      time: booking.time,
      message: booking.message ?? undefined,
      cancelToken: booking.cancelToken,
    },
  );

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: booking.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });

    if (!response.ok) {
      console.error("[dashboard booking-email] Send failed:", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[dashboard booking-email] Send failed:", error);
    return false;
  }
}
