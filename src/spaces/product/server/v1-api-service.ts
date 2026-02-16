import type { NextApiRequest, NextApiResponse } from "next";
import type { ZodType } from "zod";
import { ZodError } from "zod";
import { createServerClient } from "@/spaces/identity/supabase.server-api";
import { danger_supabaseAdmin } from "@/spaces/identity/supabase.server-admin";
import { db } from "@/spaces/platform/server/db";
import type { DrizzleClient } from "@/spaces/platform/server/db";
import { TenantService } from "@/spaces/platform/server/tenant.service";
import { ApiKeyService } from "@/spaces/platform/server/api-key.service";
import { userProfiles, tenants } from "@db/platform/schema";
import { eq } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getRequiredScopeForRoute,
  scopesInclude,
  type V1Scope,
} from "@/spaces/product/server/scopes";

// Response types
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

      // 1. Authenticate User (session or API key)
      let authType: "session" | "api_key" = "session";
      let profile: { id: string; userId: string; email: string; displayName: string | null };
      let tenant: { id: string; slug: string };
      let userRole: "owner" | "admin" | "member" | "viewer" | null = null;
      let apiKeyScopes: string[] | undefined;

      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (user) {
        const [p] = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, user.id))
          .limit(1);
        if (!p) {
          return res
            .status(403)
            .json({ success: false, error: "User profile not found" });
        }
        profile = p;
        const tenantService = TenantService.create(db, user.id);
        const t = await tenantService.getTenantBySlug(tenantSlug);
        if (!t) {
          return res
            .status(404)
            .json({ success: false, error: "Tenant not found or access denied" });
        }
        tenant = { id: t.id, slug: t.slug };
        userRole = await tenantService.getUserRoleInTenant(t.id);
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
        tenant = t;
        apiKeyScopes = lookup.scopes;
        const [p] = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.id, lookup.profileId))
          .limit(1);
        if (!p) {
          return res
            .status(403)
            .json({ success: false, error: "User profile not found" });
        }
        profile = p;
      }

      const apiUser: ApiUser = {
        supabaseUserId: profile.userId,
        profileId: profile.id,
        email: profile.email,
        name: profile.displayName || "",
        authType,
      };

      // Scope enforcement for API key requests
      if (authType === "api_key" && apiKeyScopes) {
        const path = req.url?.split("?")[0] ?? "";
        const requiredScope = getRequiredScopeForRoute(
          method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
          path
        );
        if (
          requiredScope &&
          !scopesInclude(apiKeyScopes, requiredScope as V1Scope)
        ) {
          return res.status(403).json({
            success: false,
            error: "Insufficient scope for this request",
          });
        }
      }

      // 4. Parse & Validate Request Data
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

      // 5. Run Handler
      const utils: V1ApiUtilities<unknown> = {
        supabaseUserClient: supabaseClient,
        dangerSupabaseAdmin: danger_supabaseAdmin,
        db: db,
        requestData,
        apiUser,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        userRole,
        apiKeyScopes,
        handleValidationError: (err: ZodError) =>
          res.status(400).json({ success: false, error: err.message }),
        handleError: (err: Error) => {
          console.error(err);
          res.status(500).json({ success: false, error: err.message });
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
