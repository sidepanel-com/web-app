import type { NextApiRequest, NextApiResponse } from "next";
import type { ZodType } from "zod";
import { ZodError } from "zod";
import { createServerClient } from "@/spaces/identity/supabase.server-api";
import { danger_supabaseAdmin } from "@/spaces/identity/supabase.server-admin";
import { db } from "@/spaces/platform/server/db";
import type { DrizzleClient } from "@/spaces/platform/server/db";
import { ApiKeyService } from "@/spaces/platform/server/api-key.service";
import { tenants } from "@db/platform/schema";
import { eq } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getRequiredScopeForRoute,
  scopesInclude,
  SCOPE_PREFIX_TO_PACKAGE_ID,
  type V1Scope,
} from "@/spaces/platform/server/v1-scopes";
import {
  resolveSessionContext,
  resolveApiKeyContext,
} from "@/spaces/platform/server/request-context";

type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiUser = {
  supabaseUserId: string;
  profileId: string;
  email: string;
  name: string;
  authType: "session" | "api_key";
};

export interface V1ApiUtilities<Data = unknown> {
  supabaseUserClient: ReturnType<typeof createServerClient>;
  dangerSupabaseAdmin: SupabaseClient;
  db: DrizzleClient;
  requestData: Data;
  apiUser: ApiUser;
  tenantId: string;
  tenantSlug: string;
  userRole: "owner" | "admin" | "member" | "viewer" | null;
  memberProfileId: string | null;
  orgUnitIds: string[];
  orgUnitPaths: string[];
  /** Set when authType is api_key; used for scope checks */
  apiKeyScopes?: string[];
  handleValidationError: (err: ZodError) => void;
  handleError: (err: Error) => void;
}

type V1Handler<Data> = (utils: V1ApiUtilities<Data>) => Promise<unknown>;

export type V1ApiHandlers<
  SchemaMap extends Partial<Record<HttpMethod, ZodType<unknown>>>
> = {
  [M in HttpMethod]?: V1Handler<
    SchemaMap[M] extends ZodType<infer T> ? T : unknown
  >;
};

type SchemaMap = Partial<Record<HttpMethod, ZodType<unknown>>>;

export class V1ApiService<SM extends SchemaMap> {
  constructor(private handlers: V1ApiHandlers<SM>, protected schemas?: SM) {}

  public async run(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<unknown>>
  ) {
    try {
      const supabaseClient = createServerClient(req, res);
      const method = req.method as HttpMethod;
      const handler = this.handlers[method];

      if (!handler) {
        return res
          .status(405)
          .json({ success: false, error: "Method not allowed" });
      }

      const tenantSlug =
        (req.headers["x-tenant-slug"] as string) ||
        (req.query.tenantSlug as string);

      if (!tenantSlug) {
        return res.status(400).json({
          success: false,
          error:
            "Tenant identification (X-Tenant-Slug header or query param) is required",
        });
      }

      // Derive package ID from route scope (used in context resolution)
      const routePath = req.url?.split("?")[0] ?? "";
      const routeScope = getRequiredScopeForRoute(method as HttpMethod, routePath);
      const scopePrefix = routeScope?.split(":")[0];
      const packageId = scopePrefix
        ? SCOPE_PREFIX_TO_PACKAGE_ID[scopePrefix]
        : undefined;

      let authType: "session" | "api_key" = "session";
      let apiKeyScopes: string[] | undefined;
      let contextResult: Awaited<ReturnType<typeof resolveSessionContext>>;

      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (user) {
        contextResult = await resolveSessionContext(
          db,
          user.id,
          tenantSlug,
          packageId,
        );
        if (!contextResult) {
          return res
            .status(404)
            .json({ success: false, error: "Tenant not found or access denied" });
        }
      } else {
        authType = "api_key";
        const bearer =
          (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "").trim();
        const headerKey = (req.headers["x-api-key"] as string)?.trim();
        const rawKey = headerKey || (bearer ? bearer : null);
        if (!rawKey) {
          return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const apiKeyService = new ApiKeyService(db);
        const lookup = await apiKeyService.lookupByRawKey(rawKey);
        if (!lookup) {
          return res.status(401).json({ success: false, error: "Invalid API key" });
        }

        const [t] = await db
          .select({ id: tenants.id, slug: tenants.slug })
          .from(tenants)
          .where(eq(tenants.id, lookup.tenantId))
          .limit(1);
        if (!t || t.slug !== tenantSlug) {
          return res.status(403).json({
            success: false,
            error: "API key is not valid for this tenant",
          });
        }

        apiKeyScopes = lookup.scopes;
        contextResult = await resolveApiKeyContext(
          db,
          lookup.profileId,
          t.id,
          t.slug,
          packageId,
        );
        if (!contextResult) {
          return res
            .status(403)
            .json({ success: false, error: "User profile not found" });
        }
      }

      // Scope enforcement for API key requests
      if (authType === "api_key" && apiKeyScopes && routeScope) {
        if (!scopesInclude(apiKeyScopes, routeScope as V1Scope)) {
          return res.status(403).json({
            success: false,
            error: "Insufficient scope for this request",
          });
        }
      }

      // Package enablement (already resolved in the context query)
      if (!contextResult.packageEnabled) {
        return res.status(403).json({
          success: false,
          error: `Package "${packageId}" is disabled for this tenant`,
        });
      }

      const apiUser: ApiUser = {
        supabaseUserId: contextResult.userId,
        profileId: contextResult.profileId,
        email: contextResult.email,
        name: contextResult.displayName || "",
        authType,
      };

      // Parse & Validate Request Data
      let requestData: unknown;
      const schema = this.schemas?.[method];
      try {
        const raw =
          method === "GET" ? req.query : { ...req.body, ...req.query };
        requestData = schema ? schema.parse(raw) : raw;
      } catch (err) {
        if (err instanceof ZodError) {
          return res.status(400).json({ success: false, error: err.message });
        }
        throw err;
      }

      const utils: V1ApiUtilities<unknown> = {
        supabaseUserClient: supabaseClient,
        dangerSupabaseAdmin: danger_supabaseAdmin,
        db: db,
        requestData,
        apiUser,
        tenantId: contextResult.tenantId,
        tenantSlug: contextResult.tenantSlug,
        userRole: contextResult.userRole,
        memberProfileId: contextResult.memberProfileId,
        orgUnitIds: contextResult.orgUnitIds,
        orgUnitPaths: contextResult.orgUnitPaths,
        apiKeyScopes,
        handleValidationError: (err: ZodError) =>
          res.status(400).json({ success: false, error: err.message }),
        handleError: (err: Error) => {
          console.error(err);
          return res.status(500).json({ success: false, error: err.message });
        },
      };

      const result = await (handler as V1Handler<unknown>)(utils);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error("V1 API Error:", err);
      return res
        .status(500)
        .json({ success: false, error: "Internal Server Error" });
    }
  }
}
