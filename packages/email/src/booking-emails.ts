import { type DetailRow, type EmailContact, renderEmail } from "./index";

export interface BookingEmailContext {
  siteName: string;
  siteUrl: string;
  contact?: EmailContact;
}

export interface BookingEmailPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceLabel: string;
  dateLabel: string;
  time: string;
  message?: string;
  cancelToken: string;
  confirmToken: string;
}

function bookingDetailRows(booking: Pick<BookingEmailPayload, "serviceLabel" | "dateLabel" | "time" | "message">): DetailRow[] {
  return [
    { label: "Behandling", value: booking.serviceLabel },
    { label: "Dato", value: booking.dateLabel },
    { label: "Klokkeslett", value: booking.time },
    ...(booking.message ? [{ label: "Melding", value: booking.message }] : []),
  ];
}

export function buildBookingReceivedCustomerEmail(
  context: BookingEmailContext,
  booking: BookingEmailPayload,
): { subject: string; html: string; text: string } {
  const cancelUrl = `${context.siteUrl}/avbestill?token=${encodeURIComponent(booking.cancelToken)}`;
  const detailRows = bookingDetailRows(booking);

  const text = [
    `Hei ${booking.firstName},`,
    "",
    `Takk for timebestillingen hos ${context.siteName}. Vi har mottatt forespørselen din:`,
    "",
    `Behandling: ${booking.serviceLabel}`,
    `Dato: ${booking.dateLabel}`,
    `Klokkeslett: ${booking.time}`,
    ...(booking.message ? [`Melding: ${booking.message}`] : []),
    "",
    "Terje tar kontakt for å bekrefte timen.",
    "",
    `Avbestillingskode: ${booking.cancelToken}`,
    `Avbestill online: ${cancelUrl}`,
  ].join("\n");

  const html = renderEmail({
    siteName: context.siteName,
    siteUrl: context.siteUrl,
    preheader: `Vi har mottatt timebestillingen din – ${booking.dateLabel} kl. ${booking.time}.`,
    badge: { label: "Venter bekreftelse", tone: "pending" },
    heading: "Timebestilling mottatt",
    intro: [
      `Hei ${booking.firstName}, takk for timebestillingen hos ${context.siteName}.`,
      "Vi har mottatt forespørselen din, og Terje tar kontakt for å bekrefte timen.",
    ],
    detailTitle: "Din time",
    detailRows,
    highlight: {
      title: "Avbestilling",
      description: "Lagre denne koden eller lenken dersom du må avlyse timen senere.",
      code: booking.cancelToken,
      link: { label: "Avbestill timen online", url: cancelUrl },
    },
    contact: context.contact,
  });

  return {
    subject: `Timebestilling mottatt – ${context.siteName}`,
    html,
    text,
  };
}

export function buildBookingAdminNewRequestEmail(
  context: BookingEmailContext,
  booking: BookingEmailPayload,
): { subject: string; html: string; text: string } {
  const cancelUrl = `${context.siteUrl}/avbestill?token=${encodeURIComponent(booking.cancelToken)}`;
  const confirmUrl = `${context.siteUrl}/bekreft-time?token=${encodeURIComponent(booking.confirmToken)}`;
  const detailRows = bookingDetailRows(booking);

  const adminRows: DetailRow[] = [
    { label: "Navn", value: `${booking.firstName} ${booking.lastName}` },
    { label: "E-post", value: booking.email },
    { label: "Telefon", value: booking.phone },
    ...detailRows,
  ];

  const text = [
    "Ny timebestilling mottatt:",
    "",
    ...adminRows.map((row) => `${row.label}: ${row.value}`),
    "",
    `Bekreft timebestilling: ${confirmUrl}`,
    "",
    `Avbestillingskode: ${booking.cancelToken}`,
    `Avbestillingslenke: ${cancelUrl}`,
  ].join("\n");

  const html = renderEmail({
    siteName: context.siteName,
    siteUrl: context.siteUrl,
    preheader: `${booking.firstName} ${booking.lastName} – ${booking.serviceLabel}`,
    badge: { label: "Ny timebestilling", tone: "info" },
    heading: "Ny timebestilling",
    intro: [
      `${booking.firstName} ${booking.lastName} har sendt inn en timebestilling.`,
      "Klikk knappen under for å bekrefte timen. Kunden får da en e-post med bekreftelse.",
    ],
    detailTitle: "Detaljer",
    detailRows: adminRows,
    button: { label: "Bekreft timebestilling", url: confirmUrl },
    highlight: {
      title: "Avbestilling",
      code: booking.cancelToken,
      link: { label: "Åpne avbestillingslenke", url: cancelUrl },
    },
    signoff: false,
  });

  return {
    subject: `Ny timebestilling – ${booking.firstName} ${booking.lastName}`,
    html,
    text,
  };
}

export function buildBookingConfirmedCustomerEmail(
  context: BookingEmailContext,
  booking: Pick<
    BookingEmailPayload,
    "firstName" | "serviceLabel" | "dateLabel" | "time" | "message" | "cancelToken"
  >,
): { subject: string; html: string; text: string } {
  const cancelUrl = `${context.siteUrl}/avbestill?token=${encodeURIComponent(booking.cancelToken)}`;
  const detailRows = bookingDetailRows(booking);

  const text = [
    `Hei ${booking.firstName},`,
    "",
    `Terje har bekreftet timebestillingen din hos ${context.siteName}.`,
    "",
    `Behandling: ${booking.serviceLabel}`,
    `Dato: ${booking.dateLabel}`,
    `Klokkeslett: ${booking.time}`,
    ...(booking.message ? [`Melding: ${booking.message}`] : []),
    "",
    "Vi gleder oss til å se deg.",
    "",
    `Avbestill online: ${cancelUrl}`,
  ].join("\n");

  const html = renderEmail({
    siteName: context.siteName,
    siteUrl: context.siteUrl,
    preheader: `Timen din ${booking.dateLabel} kl. ${booking.time} er bekreftet.`,
    badge: { label: "Bekreftet", tone: "success" },
    heading: "Timen er bekreftet",
    intro: [
      `Hei ${booking.firstName},`,
      "Terje har bekreftet timebestillingen din. Vi gleder oss til å se deg.",
    ],
    detailTitle: "Din time",
    detailRows,
    highlight: {
      title: "Avbestilling",
      description: "Må du avlyse? Bruk lenken under.",
      link: { label: "Avbestill timen online", url: cancelUrl },
    },
    contact: context.contact,
  });

  return {
    subject: `Timen er bekreftet – ${context.siteName}`,
    html,
    text,
  };
}
