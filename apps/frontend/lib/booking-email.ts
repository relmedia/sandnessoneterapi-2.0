import "server-only";

import {
  buildBookingAdminNewRequestEmail,
  buildBookingConfirmedCustomerEmail,
  buildBookingReceivedCustomerEmail,
  type BookingEmailPayload,
} from "@repo/email/booking-emails";
import { renderEmail, type EmailContact } from "@repo/email";

import { formatDateNbLong } from "@/lib/booking";
import { getSettings } from "@/lib/content";
import { type ResolvedEmailConfig, resolveEmailConfig } from "@/lib/email-settings";
import { formatPhone } from "@/lib/format";

export { isEmailConfigured } from "@/lib/email-settings";

const SITE_NAME = "Sandnes Soneterapi";

export interface BookingEmailDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceLabel: string;
  date: string;
  time: string;
  message?: string;
  cancelToken: string;
  confirmToken: string;
}

export interface CourseRegistrationEmailDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  courseTitle: string;
  sessionLabel: string | null;
  price: number | null;
  message?: string;
}

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

function formatPriceNb(price: number): string {
  return `${price.toLocaleString("nb-NO")} kr`;
}

async function getEmailContext(): Promise<{
  config: ResolvedEmailConfig;
  siteName: string;
  siteUrl: string;
  contact: EmailContact;
}> {
  const [config, settings] = await Promise.all([resolveEmailConfig(), getSettings()]);
  return {
    config,
    siteName: settings.title ?? SITE_NAME,
    siteUrl: getSiteUrl(),
    contact: {
      phone: settings.phone ? formatPhone(settings.phone) : undefined,
      email: settings.email ?? undefined,
      address: settings.address ?? undefined,
      facebookUrl: settings.facebook_url ?? undefined,
    },
  };
}

async function sendEmail(
  config: ResolvedEmailConfig,
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<boolean> {
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

    if (!response.ok) {
      console.error("[booking-email] Send failed:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[booking-email] Send failed:", error);
    return false;
  }
}

function toEmailPayload(booking: BookingEmailDetails): BookingEmailPayload {
  return {
    firstName: booking.firstName,
    lastName: booking.lastName,
    email: booking.email,
    phone: formatPhone(booking.phone),
    serviceLabel: booking.serviceLabel,
    dateLabel: formatDateNbLong(booking.date),
    time: booking.time,
    message: booking.message,
    cancelToken: booking.cancelToken,
    confirmToken: booking.confirmToken,
  };
}

export async function sendBookingConfirmationEmails(
  booking: BookingEmailDetails,
  adminEmail: string | null,
): Promise<{ customerSent: boolean; adminSent: boolean }> {
  const { config, siteName, siteUrl, contact } = await getEmailContext();
  const adminTo = adminEmail ?? config.adminEmail;
  const context = { siteName, siteUrl, contact };
  const payload = toEmailPayload(booking);

  const customerEmail = buildBookingReceivedCustomerEmail(context, payload);
  const customerSent = await sendEmail(
    config,
    booking.email,
    customerEmail.subject,
    customerEmail.html,
    customerEmail.text,
  );

  let adminSent = false;
  if (adminTo) {
    const adminEmailContent = buildBookingAdminNewRequestEmail(context, payload);
    adminSent = await sendEmail(
      config,
      adminTo,
      adminEmailContent.subject,
      adminEmailContent.html,
      adminEmailContent.text,
    );
  }

  return { customerSent, adminSent };
}

export async function sendBookingConfirmedEmail(booking: BookingEmailDetails): Promise<boolean> {
  const { config, siteName, siteUrl, contact } = await getEmailContext();
  const payload = toEmailPayload(booking);
  const email = buildBookingConfirmedCustomerEmail(
    { siteName, siteUrl, contact },
    payload,
  );

  return sendEmail(config, booking.email, email.subject, email.html, email.text);
}

export async function sendCourseRegistrationEmails(
  registration: CourseRegistrationEmailDetails,
  adminEmail: string | null,
): Promise<{ customerSent: boolean; adminSent: boolean }> {
  const { config, siteName, siteUrl, contact } = await getEmailContext();
  const adminTo = adminEmail ?? config.adminEmail;

  const detailRows = [
    { label: "Kurs", value: registration.courseTitle },
    ...(registration.sessionLabel ? [{ label: "Når", value: registration.sessionLabel }] : []),
    ...(registration.price != null ? [{ label: "Pris", value: formatPriceNb(registration.price) }] : []),
    ...(registration.message ? [{ label: "Melding", value: registration.message }] : []),
  ];

  const customerText = [
    `Hei ${registration.firstName},`,
    "",
    `Takk for påmeldingen til «${registration.courseTitle}» hos ${siteName}.`,
    "",
    ...detailRows.map((row) => `${row.label}: ${row.value}`),
    "",
    "Terje tar kontakt for å bekrefte plassen og avtale betaling.",
  ].join("\n");

  const customerHtml = renderEmail({
    siteName,
    siteUrl,
    preheader: `Vi har mottatt påmeldingen din til ${registration.courseTitle}.`,
    badge: { label: "Påmelding mottatt", tone: "pending" },
    heading: "Kurspåmelding mottatt",
    intro: [
      `Hei ${registration.firstName}, takk for påmeldingen til «${registration.courseTitle}».`,
      "Terje tar kontakt for å bekrefte plassen og avtale betaling.",
    ],
    detailTitle: "Kursdetaljer",
    detailRows,
    contact,
  });

  const customerSent = await sendEmail(
    config,
    registration.email,
    `Kurspåmelding mottatt – ${registration.courseTitle}`,
    customerHtml,
    customerText,
  );

  let adminSent = false;
  if (adminTo) {
    const adminRows = [
      { label: "Navn", value: `${registration.firstName} ${registration.lastName}` },
      { label: "E-post", value: registration.email },
      { label: "Telefon", value: formatPhone(registration.phone) },
      ...detailRows,
    ];

    const adminText = [
      "Ny kurspåmelding mottatt:",
      "",
      ...adminRows.map((row) => `${row.label}: ${row.value}`),
    ].join("\n");

    const adminHtml = renderEmail({
      siteName,
      siteUrl,
      preheader: `${registration.firstName} ${registration.lastName} – ${registration.courseTitle}`,
      badge: { label: "Ny påmelding", tone: "info" },
      heading: "Ny kurspåmelding",
      intro: [`${registration.firstName} ${registration.lastName} har meldt seg på «${registration.courseTitle}».`],
      detailTitle: "Detaljer",
      detailRows: adminRows,
      signoff: false,
    });

    adminSent = await sendEmail(
      config,
      adminTo,
      `Ny kurspåmelding – ${registration.firstName} ${registration.lastName}`,
      adminHtml,
      adminText,
    );
  }

  return { customerSent, adminSent };
}
