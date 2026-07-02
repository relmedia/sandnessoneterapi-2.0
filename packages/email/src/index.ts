/**
 * Shared, email-client-safe HTML layout for all transactional emails.
 * Uses table-based markup and inline styles for maximum compatibility
 * (Gmail, Outlook, Apple Mail, etc.).
 *
 * This is a pure function with no runtime dependencies, so it can be shared
 * between the public site and the dashboard.
 */

const COLORS = {
  cream: "#faf7f2",
  stone: "#3d3530",
  muted: "#7a6e68",
  sage: "#6b8c76",
  sageLight: "#ebf0ec",
  sageDark: "#4e6b58",
  warm: "#c4a882",
  warmLight: "#f2ebe0",
  border: "#e7e0d6",
  pageBg: "#f0eae0",
  white: "#ffffff",
} as const;

export type BadgeTone = "success" | "pending" | "info" | "neutral";

export interface DetailRow {
  label: string;
  value: string;
}

export interface EmailButton {
  label: string;
  url: string;
  /** 'primary' = brand stone, 'vipps' = Vipps orange */
  variant?: "primary" | "vipps";
}

export interface EmailHighlight {
  title: string;
  description?: string;
  /** Monospace code block, e.g. a cancellation token */
  code?: string;
  link?: { label: string; url: string };
}

export interface EmailContact {
  phone?: string;
  email?: string;
  address?: string;
  /** Facebook page URL. Renders a "Følg oss på Facebook" card in the footer. */
  facebookUrl?: string;
}

export interface RenderEmailOptions {
  siteName: string;
  siteUrl: string;
  /** Shown under site name in the header, e.g. practitioner name */
  tagline?: string;
  /** Short hidden preview text shown in inbox list */
  preheader?: string;
  badge?: { label: string; tone?: BadgeTone };
  heading: string;
  /** Intro paragraphs (plain strings, will be escaped) */
  intro?: string[];
  detailTitle?: string;
  detailRows?: DetailRow[];
  button?: EmailButton;
  highlight?: EmailHighlight;
  /** Closing paragraphs after details/button */
  outro?: string[];
  contact?: EmailContact;
  /** Show "Med vennlig hilsen, {siteName}". Default true; set false for admin notices. */
  signoff?: boolean;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function badgeStyles(tone: BadgeTone): { bg: string; color: string } {
  switch (tone) {
    case "success":
      return { bg: COLORS.sageLight, color: COLORS.sageDark };
    case "pending":
      return { bg: "#fbf1de", color: "#9a6b1f" };
    case "info":
      return { bg: "#eef1f4", color: "#445869" };
    default:
      return { bg: "#efe9df", color: COLORS.muted };
  }
}

function renderParagraphs(paragraphs: string[] | undefined, color: string): string {
  if (!paragraphs?.length) return "";
  return paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${color}">${escapeHtml(text)}</p>`,
    )
    .join("");
}

function renderBadge(badge: RenderEmailOptions["badge"]): string {
  if (!badge) return "";
  const { bg, color } = badgeStyles(badge.tone ?? "neutral");
  return `
    <tr>
      <td style="padding:0 40px 18px">
        <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${bg};color:${color};font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">${escapeHtml(
          badge.label,
        )}</span>
      </td>
    </tr>`;
}

function renderDetailTable(title: string | undefined, rows: DetailRow[] | undefined): string {
  if (!rows?.length) return "";
  const heading = title
    ? `<p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.sage}">${escapeHtml(
        title,
      )}</p>`
    : "";

  const body = rows
    .map(
      (row, index) => `
        <tr>
          <td style="padding:11px 16px;font-size:13px;color:${COLORS.muted};width:42%;border-top:${
            index === 0 ? "0" : `1px solid ${COLORS.border}`
          }">${escapeHtml(row.label)}</td>
          <td style="padding:11px 16px;font-size:14px;color:${COLORS.stone};font-weight:500;border-top:${
            index === 0 ? "0" : `1px solid ${COLORS.border}`
          }">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join("");

  return `
    <tr>
      <td style="padding:0 40px 8px">
        ${heading}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${COLORS.cream};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden">
          <tbody>${body}</tbody>
        </table>
      </td>
    </tr>`;
}

function renderButton(button: EmailButton | undefined): string {
  if (!button) return "";
  const isVipps = button.variant === "vipps";
  const bg = isVipps ? "#ff5b24" : COLORS.stone;
  const color = isVipps ? "#ffffff" : COLORS.cream;
  return `
    <tr>
      <td style="padding:24px 40px 8px">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="border-radius:999px;background:${bg}">
              <a href="${button.url}" style="display:inline-block;padding:14px 30px;font-size:14px;font-weight:600;letter-spacing:0.02em;color:${color};text-decoration:none;border-radius:999px">${escapeHtml(
                button.label,
              )}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderHighlight(highlight: EmailHighlight | undefined): string {
  if (!highlight) return "";
  const description = highlight.description
    ? `<p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:${COLORS.muted}">${escapeHtml(
        highlight.description,
      )}</p>`
    : "";
  const code = highlight.code
    ? `<p style="margin:0 0 12px;font-family:'SFMono-Regular',Consolas,monospace;font-size:14px;letter-spacing:0.04em;color:${COLORS.stone};word-break:break-all">${escapeHtml(
        highlight.code,
      )}</p>`
    : "";
  const link = highlight.link
    ? `<a href="${highlight.link.url}" style="font-size:14px;font-weight:600;color:${COLORS.sageDark};text-decoration:none">${escapeHtml(
        highlight.link.label,
      )} &rarr;</a>`
    : "";

  return `
    <tr>
      <td style="padding:24px 40px 8px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${COLORS.sageLight};border-radius:14px">
          <tr>
            <td style="padding:20px 22px">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.sage}">${escapeHtml(
                highlight.title,
              )}</p>
              ${description}${code}${link}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/$/, "");
}

function renderEmailHeader(
  options: Pick<RenderEmailOptions, "siteName" | "siteUrl" | "tagline">,
): string {
  const homeUrl = normalizeSiteUrl(options.siteUrl);
  const logoUrl = `${homeUrl}/images/logo.png`;
  const tagline = options.tagline ?? "Terje Horpestad";

  return `
        <tr>
          <td style="padding:18px 40px;background:${COLORS.cream};border-bottom:1px solid ${COLORS.border}">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:10px;vertical-align:middle">
                  <a href="${homeUrl}" style="text-decoration:none">
                    <img src="${logoUrl}" width="39" height="40" alt="" style="display:block;border:0;height:40px;width:auto;max-height:40px">
                  </a>
                </td>
                <td style="vertical-align:middle">
                  <a href="${homeUrl}" style="text-decoration:none">
                    <span style="display:block;font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;line-height:1.2;font-weight:400;color:${COLORS.stone}">${escapeHtml(
                      options.siteName,
                    )}</span>
                    <span style="display:block;margin-top:3px;font-size:10px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.muted}">${escapeHtml(
                      tagline,
                    )}</span>
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
}

function renderFacebookCard(url: string | undefined): string {
  if (!url) return "";
  return `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-collapse:separate">
          <tr>
            <td style="border:1px solid ${COLORS.border};border-radius:12px;background:${COLORS.cream}">
              <a href="${url}" target="_blank" style="text-decoration:none;display:block;padding:12px 16px">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:12px">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="36" height="36" align="center" valign="middle" style="width:36px;height:36px;background:#1877f2;border-radius:8px;color:#ffffff;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:700;line-height:36px;text-align:center">f</td>
                        </tr>
                      </table>
                    </td>
                    <td style="vertical-align:middle">
                      <span style="display:block;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#a99f95">Facebook</span>
                      <span style="display:block;margin-top:2px;font-size:14px;color:${COLORS.stone}">Følg oss på Facebook &rarr;</span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
        </table>`;
}

function renderContact(siteName: string, contact: EmailContact | undefined): string {
  const rows: string[] = [];
  if (contact?.phone) {
    rows.push(
      `<a href="tel:${contact.phone.replace(/\D/g, "")}" style="color:${COLORS.muted};text-decoration:none">${escapeHtml(
        contact.phone,
      )}</a>`,
    );
  }
  if (contact?.email) {
    rows.push(
      `<a href="mailto:${escapeHtml(contact.email)}" style="color:${COLORS.muted};text-decoration:none">${escapeHtml(
        contact.email,
      )}</a>`,
    );
  }
  if (contact?.address) {
    rows.push(escapeHtml(contact.address));
  }

  const contactLine = rows.length
    ? `<p style="margin:0 0 6px;font-size:12px;line-height:1.7;color:${COLORS.muted}">${rows.join(
        " &nbsp;·&nbsp; ",
      )}</p>`
    : "";

  return `
    <tr>
      <td style="padding:28px 40px 36px;border-top:1px solid ${COLORS.border}">
        ${renderFacebookCard(contact?.facebookUrl)}
        ${contactLine}
        <p style="margin:0;font-size:12px;color:#a99f95">© ${new Date().getFullYear()} ${escapeHtml(
          siteName,
        )}</p>
      </td>
    </tr>`;
}

export function renderEmail(options: RenderEmailOptions): string {
  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(
        options.preheader,
      )}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(options.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.pageBg};-webkit-font-smoothing:antialiased">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.pageBg}">
  <tr>
    <td align="center" style="padding:32px 16px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${COLORS.white};border-radius:18px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;box-shadow:0 6px 24px rgba(61,53,48,0.08)">
        ${renderEmailHeader(options)}
        <tr>
          <td style="height:4px;background:${COLORS.warm};font-size:0;line-height:0">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:36px 40px 8px">
            <h1 style="margin:0;font-size:23px;line-height:1.3;font-weight:600;color:${COLORS.stone}">${escapeHtml(
              options.heading,
            )}</h1>
          </td>
        </tr>
        ${renderBadge(options.badge)}
        <tr>
          <td style="padding:14px 40px 8px">
            ${renderParagraphs(options.intro, COLORS.muted)}
          </td>
        </tr>
        ${renderDetailTable(options.detailTitle, options.detailRows)}
        ${renderButton(options.button)}
        ${renderHighlight(options.highlight)}
        <tr>
          <td style="padding:20px 40px 4px">
            ${renderParagraphs(options.outro, COLORS.muted)}
            ${
              options.signoff === false
                ? ""
                : `<p style="margin:18px 0 0;font-size:15px;line-height:1.6;color:${COLORS.stone}">Med vennlig hilsen,<br><strong style="font-weight:600">${escapeHtml(
                    options.siteName,
                  )}</strong></p>`
            }
          </td>
        </tr>
        ${renderContact(options.siteName, options.contact)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
