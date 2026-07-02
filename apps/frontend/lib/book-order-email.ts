import "server-only";

import { renderEmail, type DetailRow, type EmailContact } from "@repo/email";

import {
  formatBookOrderStatus,
  formatShippingAddress,
  type BookOrderStatus,
} from "@/lib/book-order";
import { getSettings } from "@/lib/content";
import { resolveEmailConfig } from "@/lib/email-settings";
import { formatPhone } from "@/lib/format";
import { getVippsPaymentInstructions } from "@/lib/vipps-number";

const SITE_NAME = "Sandnes Soneterapi";

export interface BookOrderEmailDetails {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  bookTitle: string;
  bookPrice: number;
  shippingFee: number;
  status: BookOrderStatus;
  addressLine1: string;
  postalCode: string;
  city: string;
  message?: string;
}

export interface BookOrderPlacedEmailDetails extends BookOrderEmailDetails {
  totalNok: number;
  vippsNumber: string;
}

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

function formatNok(amount: number): string {
  return `${amount.toLocaleString("nb-NO")} kr`;
}

async function getEmailContext() {
  const [config, settings] = await Promise.all([resolveEmailConfig(), getSettings()]);
  const contact: EmailContact = {
    phone: settings.phone ? formatPhone(settings.phone) : undefined,
    email: settings.email ?? undefined,
    address: settings.address ?? undefined,
    facebookUrl: settings.facebook_url ?? undefined,
  };
  return {
    config,
    siteName: settings.title ?? SITE_NAME,
    siteUrl: getSiteUrl(),
    contact,
    adminEmail: config.adminEmail,
  };
}

async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const { config } = await getEmailContext();
  if (!config.apiKey || !config.from) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: config.from, to, subject, html, text }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function sendBookOrderPlacedEmails(details: BookOrderPlacedEmailDetails): Promise<void> {
  const { siteName, siteUrl, contact, adminEmail } = await getEmailContext();
  const instructions = getVippsPaymentInstructions(details.totalNok, details.bookTitle);

  const detailRows: DetailRow[] = [
    { label: "Bok", value: details.bookTitle },
    { label: "Bokpris", value: formatNok(details.bookPrice) },
    { label: "Frakt", value: formatNok(details.shippingFee) },
    { label: "Totalt å betale", value: formatNok(details.totalNok) },
    { label: "Vippsnummer", value: details.vippsNumber },
    { label: "Leveres til", value: formatShippingAddress(details) },
  ];

  const customerText = [
    `Hei ${details.name},`,
    "",
    "Takk for bestillingen. For å fullføre, betal med Vipps:",
    "",
    ...instructions.map((step, index) => `${index + 1}. ${step}`),
    "",
    "Vi sender boken når betalingen er mottatt.",
  ].join("\n");

  const customerHtml = renderEmail({
    siteName,
    siteUrl,
    preheader: `Betal ${formatNok(details.totalNok)} til ${details.vippsNumber} for å fullføre bestillingen.`,
    badge: { label: "Venter betaling", tone: "pending" },
    heading: "Fullfør betalingen med Vipps",
    intro: [
      `Hei ${details.name}, takk for bestillingen.`,
      `Betal ${formatNok(details.totalNok)} til ${details.vippsNumber} i Vipps-appen for at vi skal sende boken.`,
    ],
    detailTitle: "Bestilling",
    detailRows,
    highlight: {
      title: "Slik betaler du",
      description: instructions.join(" "),
    },
    outro: ["Vi sender boken til adressen over når betalingen er mottatt."],
    contact,
  });

  await sendEmail(details.email, `Fullfør betaling: ${details.bookTitle}`, customerHtml, customerText);

  if (adminEmail) {
    const adminRows: DetailRow[] = [
      { label: "Navn", value: `${details.name} ${details.lastName}` },
      { label: "E-post", value: details.email },
      { label: "Telefon", value: formatPhone(details.phone) },
      { label: "Bok", value: details.bookTitle },
      { label: "Totalt", value: formatNok(details.totalNok) },
      { label: "Vippsnummer", value: details.vippsNumber },
      { label: "Leveres til", value: formatShippingAddress(details) },
      { label: "Status", value: formatBookOrderStatus(details.status) },
    ];
    if (details.message) {
      adminRows.push({ label: "Melding", value: details.message });
    }

    const adminHtml = renderEmail({
      siteName,
      siteUrl,
      preheader: `${details.bookTitle} – ${details.name} ${details.lastName}`,
      badge: { label: "Venter betaling", tone: "pending" },
      heading: "Ny bokbestilling",
      intro: [
        `${details.name} ${details.lastName} har bestilt en bok og skal betale ${formatNok(details.totalNok)} til ${details.vippsNumber}.`,
      ],
      detailTitle: "Detaljer",
      detailRows: adminRows,
      signoff: false,
    });

    const adminText = [
      `Ny bokbestilling – venter Vipps-betaling til ${details.vippsNumber}:`,
      "",
      ...adminRows.map((row) => `${row.label}: ${row.value}`),
    ].join("\n");

    await sendEmail(
      adminEmail,
      `Bokbestilling (venter Vipps): ${details.bookTitle} – ${details.name} ${details.lastName}`,
      adminHtml,
      adminText,
    );
  }
}

export async function getBookOrderById(orderId: string): Promise<{
  bookTitle: string | null;
  bookPrice: number;
  shippingFee: number;
  status: BookOrderStatus;
  name: string;
  lastName: string;
  totalNok: number;
} | null> {
  const { createBookingClient } = await import("@/lib/booking-store");
  const supabase = createBookingClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("book_orders")
    .select("book_title, book_price, shipping_fee, status, name, last_name")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;

  const bookPrice = data.book_price ?? 0;
  const shippingFee = data.shipping_fee ?? 69;

  return {
    bookTitle: data.book_title,
    bookPrice,
    shippingFee,
    status: data.status as BookOrderStatus,
    name: data.name,
    lastName: data.last_name,
    totalNok: bookPrice + shippingFee,
  };
}
