import type { NextApiRequest, NextApiResponse } from "next";
import { ZodType, ZodError } from "zod";
import { createServerClient } from "@/spaces/identity/supabase.server-api";
import { danger_supabaseAdmin } from "@/spaces/identity/supabase.server-admin";
import { db } from "@/spaces/platform/server/db";
import type { DrizzleClient } from "@/spaces/platform/server/db";
import { TenantService } from "@/spaces/platform/server/tenant.service";
import { userProfiles } from "@db/platform/schema";
import { eq } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";

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

      // 1. Authenticate User
      let supabaseUserId: string | null = null;
      let authType: "session" | "api_key" = "session";

      // Try session auth first
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (user) {
        supabaseUserId = user.id;
        authType = "session";
      } else {
        // Try API Key auth
        const apiKey = req.headers["x-api-key"] as string;
        if (apiKey) {
          // TODO: Implement actual API key lookup
          // supabaseUserId = await lookupApiKey(apiKey);
          authType = "api_key";
        }
      }

      if (!supabaseUserId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // 2. Resolve Profile
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, supabaseUserId))
        .limit(1);

      if (!profile) {
        return res
          .status(403)
          .json({ success: false, error: "User profile not found" });
      }

      const apiUser: ApiUser = {
        supabaseUserId,
        profileId: profile.id,
        email: profile.email,
        name: profile.displayName || "",
        authType,
      };

      // 3. Identify Tenant & Role
      const tenantSlug =
        (req.headers["x-tenant-slug"] as string) ||
        (req.query.tenantSlug as string);

      if (!tenantSlug) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Tenant identification (X-Tenant-Slug header or query param) is required",
          });
      }

      const tenantService = TenantService.create(db, supabaseUserId);
      const tenant = await tenantService.getTenantBySlug(tenantSlug);

      if (!tenant) {
        return res
          .status(404)
          .json({ success: false, error: "Tenant not found or access denied" });
      }

      const userRole = await tenantService.getUserRoleInTenant(tenant.id);

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
      const utils: V1ApiUtilities<any> = {
        supabaseUserClient: supabaseClient,
        dangerSupabaseAdmin: danger_supabaseAdmin,
        db: db,
        requestData,
        apiUser,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        userRole,
        handleValidationError: (err: ZodError) =>
          res.status(400).json({ success: false, error: err.message }),
        handleError: (err: Error) => {
          console.error(err);
          res.status(500).json({ success: false, error: err.message });
        },
      };

      const result = await (handler as any)(utils);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error("V1 API Error:", err);
      return res
        .status(500)
        .json({ success: false, error: "Internal Server Error" });
    }
  }
}
