function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function looksLikeHtml(value: string): boolean {
  return /<\/?(p|h[1-6]|ul|ol|li|strong|em|br|div|blockquote|figure|img)\b/i.test(value);
}

// Turns a plain-text body (paragraphs separated by blank lines) into structured
// HTML so legacy plain-text content opens as formatted, editable rich text.
// Content that already contains HTML is returned untouched.
export function bodyToHtml(body: string | null | undefined): string {
  if (!body) return "";
  if (looksLikeHtml(body)) return body;

  const normalized = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return "";

  return normalized
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length === 0) return "";

      const first = lines[0];

      if (lines.length === 1 && /^\d+\.\s*helg\b/i.test(first)) {
        return `<h2>${escapeHtml(first)}</h2>`;
      }
      if (lines.length === 1 && /:$/.test(first)) {
        return `<h3>${escapeHtml(first)}</h3>`;
      }
      if (/:$/.test(first)) {
        const rest = lines.slice(1).map(escapeHtml).join("<br>");
        return `<p><strong>${escapeHtml(first)}</strong><br>${rest}</p>`;
      }
      if (lines.length > 1) {
        return `<ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
      }
      return `<p>${escapeHtml(first)}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}
