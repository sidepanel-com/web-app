/**
 * V1 Product API scopes and route→scope mapping.
 * Package-prefixed resource:action (e.g. comms:people:read) for API key permissions.
 */

export const PACKAGE_COMMS = "comms" as const;

/** Comms package scopes (current product). Expand when adding emails, meetings, calls, messages. */
export const V1_SCOPES = {
  // People
  COMMS_PEOPLE_READ: `${PACKAGE_COMMS}:people:read`,
  COMMS_PEOPLE_WRITE: `${PACKAGE_COMMS}:people:write`,
  // Companies
  COMMS_COMPANIES_READ: `${PACKAGE_COMMS}:companies:read`,
  COMMS_COMPANIES_WRITE: `${PACKAGE_COMMS}:companies:write`,
  // Comms (contact methods)
  COMMS_COMMS_READ: `${PACKAGE_COMMS}:comms:read`,
  COMMS_COMMS_WRITE: `${PACKAGE_COMMS}:comms:write`,
} as const;

export type V1Scope = (typeof V1_SCOPES)[keyof typeof V1_SCOPES];

/** All comms scopes for "full comms" key preset. */
export const COMMS_SCOPES_READ: V1Scope[] = [
  V1_SCOPES.COMMS_PEOPLE_READ,
  V1_SCOPES.COMMS_COMPANIES_READ,
  V1_SCOPES.COMMS_COMMS_READ,
];

export const COMMS_SCOPES_WRITE: V1Scope[] = [
  V1_SCOPES.COMMS_PEOPLE_WRITE,
  V1_SCOPES.COMMS_COMPANIES_WRITE,
  V1_SCOPES.COMMS_COMMS_WRITE,
];

export const COMMS_SCOPES_FULL: V1Scope[] = [
  ...COMMS_SCOPES_READ,
  ...COMMS_SCOPES_WRITE,
];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Normalize API path to a pattern (replace UUID segments with :param) for scope lookup.
 * e.g. /api/v1/people/550e8400-e29b-41d4-a716-446655440000 → /api/v1/people/:personId
 */
export function normalizePathForScope(path: string): string {
  const withoutQuery = path.split("?")[0] ?? path;
  const segments = withoutQuery.split("/").filter(Boolean);
  const normalized = segments.map((seg) =>
    UUID_REGEX.test(seg) ? ":id" : seg
  );
  return "/" + normalized.join("/");
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Map (method, normalized path pattern) → required scope.
 * Path pattern uses :id for any UUID segment.
 */
const ROUTE_SCOPE_MAP: Record<string, V1Scope> = {
  "GET/api/v1/people": V1_SCOPES.COMMS_PEOPLE_READ,
  "POST/api/v1/people": V1_SCOPES.COMMS_PEOPLE_WRITE,
  "GET/api/v1/people/:id": V1_SCOPES.COMMS_PEOPLE_READ,
  "PATCH/api/v1/people/:id": V1_SCOPES.COMMS_PEOPLE_WRITE,
  "DELETE/api/v1/people/:id": V1_SCOPES.COMMS_PEOPLE_WRITE,
  "POST/api/v1/people/:id/companies": V1_SCOPES.COMMS_PEOPLE_WRITE,
  "DELETE/api/v1/people/:id/companies": V1_SCOPES.COMMS_PEOPLE_WRITE,
  "POST/api/v1/people/:id/comms": V1_SCOPES.COMMS_PEOPLE_WRITE,
  "DELETE/api/v1/people/:id/comms": V1_SCOPES.COMMS_PEOPLE_WRITE,
  "GET/api/v1/companies": V1_SCOPES.COMMS_COMPANIES_READ,
  "POST/api/v1/companies": V1_SCOPES.COMMS_COMPANIES_WRITE,
  "GET/api/v1/companies/:id": V1_SCOPES.COMMS_COMPANIES_READ,
  "PATCH/api/v1/companies/:id": V1_SCOPES.COMMS_COMPANIES_WRITE,
  "DELETE/api/v1/companies/:id": V1_SCOPES.COMMS_COMPANIES_WRITE,
  "POST/api/v1/companies/:id/people": V1_SCOPES.COMMS_COMPANIES_WRITE,
  "DELETE/api/v1/companies/:id/people": V1_SCOPES.COMMS_COMPANIES_WRITE,
  "POST/api/v1/companies/:id/comms": V1_SCOPES.COMMS_COMPANIES_WRITE,
  "DELETE/api/v1/companies/:id/comms": V1_SCOPES.COMMS_COMPANIES_WRITE,
};

/**
 * Get the required scope for a request. Returns null if no mapping (e.g. non-product route).
 */
export function getRequiredScopeForRoute(
  method: HttpMethod,
  path: string
): V1Scope | null {
  const normalized = normalizePathForScope(path);
  const key = `${method}${normalized}`;
  return ROUTE_SCOPE_MAP[key] ?? null;
}

/**
 * Check if the given scopes grant the required scope.
 * Supports exact match and wildcard: comms:*:read grants any comms:*:read scope.
 */
export function scopesInclude(scopes: string[], required: V1Scope): boolean {
  if (scopes.includes(required)) return true;
  const parts = required.split(":");
  if (parts.length !== 3) return false;
  const [pkg, , action] = parts;
  const wildcard = `${pkg}:*:${action}`;
  if (!scopes.includes(wildcard)) return false;
  return required.startsWith(`${pkg}:`) && required.endsWith(`:${action}`);
}
