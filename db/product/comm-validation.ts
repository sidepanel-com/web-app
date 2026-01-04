import { z } from "zod";

/**
 * Standardized shapes for the `value` (JSONB) column
 */
export const emailValueSchema = z.object({
  address: z.string().email().toLowerCase().trim(),
});

export const phoneValueSchema = z.object({
  number: z.string().min(1),
  sms: z.boolean().default(true),
  voice: z.boolean().default(true),
});

export const whatsappValueSchema = z.object({
  number: z.string().min(1),
});

export const linkedinValueSchema = z.object({
  vanityName: z.string().min(1),
  url: z.string().url(),
  urn: z.string().nullable().optional(),
});

export const slackValueSchema = z.object({
  handle: z.string().min(1).toLowerCase().trim(),
  workspace: z.string().min(1).toLowerCase().trim(),
});

export const otherValueSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const commValueSchemas = {
  email: emailValueSchema,
  phone: phoneValueSchema,
  linkedin: linkedinValueSchema,
  slack: slackValueSchema,
  whatsapp: whatsappValueSchema,
  other: otherValueSchema,
};

export type CommType = keyof typeof commValueSchemas;

/**
 * Helper to normalize phone numbers to E.164 (simplistic implementation)
 */
function normalizePhoneNumber(input: string): string {
  // Strip all non-digit characters except for a leading plus
  let cleaned = input.replace(/[^\d+]/g, "");
  
  // If it doesn't start with a plus, we assume it's missing the plus (simplified)
  // In a real app, you'd use a library like libphonenumber-js
  if (cleaned.length > 0 && !cleaned.startsWith("+")) {
    if (cleaned.length === 10) {
        cleaned = `+1${cleaned}`; // Default to US/Canada
    } else {
        cleaned = `+${cleaned}`;
    }
  }
  return cleaned;
}

/**
 * Helper to extract vanity name from a LinkedIn URL
 */
function extractLinkedInVanityName(url: string): string {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    // Standard URL is linkedin.com/in/vanity-name
    if (pathParts[0] === "in" && pathParts[1]) {
      return pathParts[1];
    }
    return pathParts[pathParts.length - 1] || url;
  } catch {
    return url;
  }
}

/**
 * Main normalization function
 */
export function normalizeComm(type: CommType, input: any): { value: any; canonicalValue: string } {
  switch (type) {
    case "email": {
      const parsed = emailValueSchema.parse(typeof input === "string" ? { address: input } : input);
      return {
        value: parsed,
        canonicalValue: parsed.address,
      };
    }
    case "phone": {
      const data = typeof input === "string" ? { number: input } : input;
      const parsed = phoneValueSchema.parse(data);
      const normalized = normalizePhoneNumber(parsed.number);
      const finalValue = { ...parsed, number: normalized };
      return {
        value: finalValue,
        canonicalValue: normalized,
      };
    }
    case "whatsapp": {
      const data = typeof input === "string" ? { number: input } : input;
      const parsed = whatsappValueSchema.parse(data);
      const normalized = normalizePhoneNumber(parsed.number);
      const finalValue = { ...parsed, number: normalized };
      return {
        value: finalValue,
        canonicalValue: normalized,
      };
    }
    case "linkedin": {
      const data = typeof input === "string" ? { url: input } : input;
      const vanityName = extractLinkedInVanityName(data.url || "");
      const parsed = linkedinValueSchema.parse({
        ...data,
        vanityName: data.vanityName || vanityName,
      });
      return {
        value: parsed,
        canonicalValue: parsed.vanityName,
      };
    }
    case "slack": {
      const parsed = slackValueSchema.parse(input);
      return {
        value: parsed,
        canonicalValue: `${parsed.workspace}:${parsed.handle}`,
      };
    }
    case "other": {
      const parsed = otherValueSchema.parse(input);
      return {
        value: parsed,
        canonicalValue: parsed.value,
      };
    }
    default:
      throw new Error(`Unsupported comm type: ${type}`);
  }
}

/**
 * Helper for UI display
 */
export function formatCommValue(type: CommType, value: any): string {
  if (!value) return "";
  switch (type) {
    case "email":
      return value.address || "";
    case "phone":
    case "whatsapp":
      return value.number || "";
    case "linkedin":
      return value.vanityName || value.url || "";
    case "slack":
      return `${value.handle} (${value.workspace})`;
    case "other":
      return `${value.label}: ${value.value}`;
    default:
      return typeof value === "string" ? value : JSON.stringify(value);
  }
}

