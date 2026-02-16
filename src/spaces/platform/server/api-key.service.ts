import { createHash, randomBytes } from "node:crypto";
import { eq, and, desc } from "drizzle-orm";
import type { DrizzleClient } from "./db";
import { apiKeys } from "@db/platform/schema";
import type { InferInsertModel } from "drizzle-orm";

const KEY_PREFIX = "sp_live_";
const PREFIX_DISPLAY_LENGTH = 20; // sp_live_ + 12 chars for lookup
const SECRET_BYTES = 24;

type ApiKeyInsert = InferInsertModel<typeof apiKeys>;

export type ApiKeyCreateInput = {
  name: string;
  scopes: string[];
  expiresAt?: string | null;
};

export type ApiKeyCreated = {
  id: string;
  name: string;
  keyPrefix: string;
  /** Raw key - only returned once at creation */
  key: string;
  scopes: string[];
  expiresAt: string | null;
  createdAt: string;
};

export type ApiKeyListEntry = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

export type ApiKeyLookupResult = {
  tenantId: string;
  profileId: string;
  scopes: string[];
  keyId: string;
};

function hashKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

function generateRawKey(): { raw: string; prefix: string } {
  const secret = randomBytes(SECRET_BYTES).toString("base64url");
  const raw = KEY_PREFIX + secret;
  const prefix = raw.substring(0, PREFIX_DISPLAY_LENGTH);
  return { raw, prefix };
}

export class ApiKeyService {
  constructor(private db: DrizzleClient) {}

  /**
   * Create an API key. Returns the raw key once; caller must show it to the user.
   */
  async create(
    tenantId: string,
    createdByProfileId: string,
    input: ApiKeyCreateInput
  ): Promise<ApiKeyCreated> {
    const { raw, prefix } = generateRawKey();
    const keyHash = hashKey(raw);

    const [row] = await this.db
      .insert(apiKeys)
      .values({
        tenantId,
        createdByProfileId,
        name: input.name,
        keyPrefix: prefix,
        keyHash,
        scopes: input.scopes,
        expiresAt: input.expiresAt ?? null,
      } as ApiKeyInsert)
      .returning();

    if (!row) throw new Error("Failed to create API key");

    return {
      id: row.id,
      name: row.name,
      keyPrefix: row.keyPrefix,
      key: raw,
      scopes: row.scopes ?? [],
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  }

  async list(tenantId: string): Promise<ApiKeyListEntry[]> {
    const rows = await this.db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        expiresAt: apiKeys.expiresAt,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.tenantId, tenantId))
      .orderBy(desc(apiKeys.createdAt));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      keyPrefix: r.keyPrefix,
      scopes: (r.scopes ?? []) as string[],
      expiresAt: r.expiresAt,
      lastUsedAt: r.lastUsedAt,
      createdAt: r.createdAt,
    }));
  }

  async revoke(tenantId: string, keyId: string): Promise<void> {
    await this.db
      .delete(apiKeys)
      .where(
        and(eq(apiKeys.id, keyId), eq(apiKeys.tenantId, tenantId))
      );
  }

  /**
   * Look up an API key by raw key. Returns tenant + profile + scopes for auth context.
   * Updates lastUsedAt. Returns null if not found or expired.
   */
  async lookupByRawKey(rawKey: string): Promise<ApiKeyLookupResult | null> {
    if (!rawKey.startsWith(KEY_PREFIX) || rawKey.length < PREFIX_DISPLAY_LENGTH) {
      return null;
    }
    const prefix = rawKey.substring(0, PREFIX_DISPLAY_LENGTH);

    const [row] = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyPrefix, prefix))
      .limit(1);

    if (!row) return null;
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) return null;

    const hash = hashKey(rawKey);
    if (hash !== row.keyHash) return null;

    await this.db
      .update(apiKeys)
      .set({ lastUsedAt: new Date().toISOString() })
      .where(eq(apiKeys.id, row.id));

    return {
      tenantId: row.tenantId,
      profileId: row.createdByProfileId,
      scopes: (row.scopes ?? []) as string[],
      keyId: row.id,
    };
  }
}
