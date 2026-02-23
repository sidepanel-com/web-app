import { z } from "zod";

function stripLeadingWww(host: string) {
  return host.startsWith("www.") ? host.slice(4) : host;
}

export function normalizeDomain(input: string): string {
  let s = input.trim().toLowerCase();
  if (!s) return "";

  // Allow users to paste a URL; extract hostname.
  if (s.includes("://")) {
    try {
      const url = new URL(s);
      s = url.hostname;
    } catch {
      // fall through and try to sanitize as a domain-like string
    }
  }

  // If it still contains path/query, keep only the host portion.
  s = s.split(/[/?#]/)[0] ?? s;
  // Drop a port if present.
  s = s.split(":")[0] ?? s;
  // Trim leading/trailing dots and normalize common prefix.
  s = s.replace(/^\.+/, "").replace(/\.+$/, "");
  s = stripLeadingWww(s);

  return s;
}

export function isValidDomain(input: string): boolean {
  const s = normalizeDomain(input);
  if (!s) return false;
  if (s.length > 253) return false;
  if (s.includes("..")) return false;
  if (!s.includes(".")) return false; // require TLD
  if (/[\s/\\@]/.test(s)) return false;

  const labels = s.split(".");
  for (const label of labels) {
    if (!label.length || label.length > 63) return false;
    if (!/^[a-z0-9-]+$/.test(label)) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
  }
  return true;
}

export function tryNormalizeWebsiteUrl(input: string): string | null {
  let s = input.trim();
  if (!s) return null;

  // Allow users to paste example.com without a scheme.
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    s = `https://${s}`;
  }

  try {
    const url = new URL(s);
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase();

    // Remove default ports.
    if (
      (url.protocol === "https:" && url.port === "443") ||
      (url.protocol === "http:" && url.port === "80")
    ) {
      url.port = "";
    }

    // Normalize root URL to no trailing slash for consistency.
    if (url.pathname === "/") {
      url.pathname = "";
    }

    const normalized = url.toString();
    return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
  } catch {
    return null;
  }
}

export function normalizeWebsiteUrl(input: string): string {
  const normalized = tryNormalizeWebsiteUrl(input);
  return normalized ?? input.trim();
}

export const companyDomainInputSchema = z.object({
  domain: z
    .string()
    .min(1)
    .refine((v) => isValidDomain(v), "Invalid domain")
    .transform((v) => normalizeDomain(v)),
  isPrimary: z.boolean().optional(),
});

export const companyWebsiteInputSchema = z.object({
  url: z
    .string()
    .min(1)
    .refine((v) => tryNormalizeWebsiteUrl(v) !== null, "Invalid website URL")
    .transform((v) => normalizeWebsiteUrl(v)),
  type: z.string().optional(),
  isPrimary: z.boolean().optional(),
});


