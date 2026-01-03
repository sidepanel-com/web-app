// lib/apiService.ts

import { NextApiRequest, NextApiResponse } from "next";
import { ZodType, ZodError } from "zod";
import { createServerClient } from "@/spaces/identity/supabase.server-api";
import { ApiError } from "./next-api-errors";
import { danger_supabaseAdmin } from "@/spaces/identity/supabase.server-admin";

import { SupabaseClient } from "@supabase/supabase-js";
import { UserTenantsService } from "./user-tenants.service";

// Response types
type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiUser = {
  id: string;
  email: string;
  name: string;
  selectedTenantId?: string;
};

// shape of utilities passed into each handler
export interface ApiUtilities<Data = any> {
  supabaseUserClient: ReturnType<typeof createServerClient>;
  dangerSupabaseAdmin: SupabaseClient<Database>;
  requestData: Data;
  apiUser: ApiUser;
  handleValidationError: (err: ZodError) => void;
  handleError: (err: Error) => void;
}

// each method is an async fn that receives your utils and returns whatever you want sent back
type Handler<Data> = (utils: ApiUtilities<Data>) => Promise<any>;

// map of method → handler
export type ApiHandlers<
  SchemaMap extends Partial<Record<HttpMethod, ZodType<any>>>
> = {
  [M in HttpMethod]?: Handler<SchemaMap[M] extends ZodType<infer T> ? T : any>;
};

// optional Zod schemas keyed by method
type SchemaMap = Partial<Record<HttpMethod, ZodType<any>>>;

// Add new error type for missing tenant
export const ApiErrorTypes = {
  METHOD_NOT_ALLOWED: {
    status: 405,
    code: "METHOD_NOT_ALLOWED",
    message: "Method not allowed",
  },
  UNAUTHORIZED: {
    status: 401,
    code: "UNAUTHORIZED",
    message: "Unauthorized",
  },
};

// Enhanced utilities for tenant-scoped operations
export interface TenantApiUtilities<Data = any> extends ApiUtilities<Data> {
  tenantId: string;
  tenantSlug?: string; // Add optional slug for path-based routing
}

// Enhanced utilities for user-level operations (same as base for now, but allows future extension)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UserApiUtilities<Data = any> extends ApiUtilities<Data> {
  // Could add user-specific utilities here in the future
}

// Tenant-scoped handler type
type TenantHandler<Data> = (utils: TenantApiUtilities<Data>) => Promise<any>;

// User-level handler type
type UserHandler<Data> = (utils: UserApiUtilities<Data>) => Promise<any>;

// Tenant-scoped handlers map
export type TenantApiHandlers<
  SchemaMap extends Partial<Record<HttpMethod, ZodType<any>>>
> = {
  [M in HttpMethod]?: TenantHandler<
    SchemaMap[M] extends ZodType<infer T> ? T : any
  >;
};

// User-level handlers map
export type UserApiHandlers<
  SchemaMap extends Partial<Record<HttpMethod, ZodType<any>>>
> = {
  [M in HttpMethod]?: UserHandler<
    SchemaMap[M] extends ZodType<infer T> ? T : any
  >;
};

export class ApiService<SM extends SchemaMap> {
  constructor(private handlers: ApiHandlers<SM>, protected schemas?: SM) {}

  public async run(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
  ) {
    console.log(
      "Running API service",
      req.method,
      req.url,
      req.body,
      req.query,
      req.headers
    );
    try {
      // init supabase + utils
      const supabaseClient = createServerClient(req, res);
      let requestData: any;

      const getApiUser = async () => {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        return {
          id: user?.id || "",
          email: user?.email || "",
          name: user?.user_metadata.name || "",
          selectedTenantId: undefined, // No longer used in base service
        };
      };

      const handleValidationError = (err: ZodError) => {
        return res.status(400).json({
          success: false,
          error: err.message || "Validation failed",
        });
      };

      const handleResponse = (data: any, status = 200) => {
        return res.status(status).json({ success: true, data });
      };

      const handleError = (err: Error) => {
        if (err instanceof ApiError) {
          return res.status(err.status).json({
            success: false,
            error: err.message,
          });
        }
        return res.status(500).json({
          success: false,
          error: "Internal Server Error",
        });
      };

      // pick the right handler
      const method = req.method as HttpMethod;
      const handler = this.handlers[method];
      if (!handler) {
        handleError(new ApiError("METHOD_NOT_ALLOWED"));
      }

      // parse & validate
      const schema = this.schemas?.[method];
      try {
        const raw =
          method === "GET" ? req.query : { ...req.body, ...req.query };
        requestData = schema ? schema.parse(raw) : raw;
      } catch (err) {
        if (err instanceof ZodError) {
          return handleValidationError(err);
        }
        throw err;
      }

      const apiUser = await getApiUser();
      if (!apiUser) {
        return handleError(new ApiError("UNAUTHORIZED"));
      }

      // build the utilities object
      const utils: ApiUtilities = {
        supabaseUserClient: supabaseClient,
        dangerSupabaseAdmin: danger_supabaseAdmin,
        requestData,
        apiUser,
        handleValidationError,
        handleError,
      };

      // run your handler
      try {
        const result = (await handler?.(utils)) || null;
        return handleResponse(result);
      } catch (err) {
        console.error(err);
        return handleError(err as Error);
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Internal Server Error",
      });
    }
  }
}

/**
 * API Service for user-level endpoints (tenants list, user settings, etc.)
 */
export class UserApiService<SM extends SchemaMap> extends ApiService<SM> {
  constructor(private userHandlers: UserApiHandlers<SM>, schemas?: SM) {
    // Convert user handlers to regular handlers for the parent class
    const regularHandlers: ApiHandlers<SM> = {};
    Object.entries(userHandlers).forEach(([method, handler]) => {
      regularHandlers[method as HttpMethod] = handler as Handler<any>;
    });
    super(regularHandlers, schemas);
  }

  public async run(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
  ) {
    try {
      const supabaseClient = createServerClient(req, res);
      let requestData: any;

      const getApiUser = async () => {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        return {
          id: user?.id || "",
          email: user?.email || "",
          name: user?.user_metadata.name || "",
          selectedTenantId: undefined, // User endpoints don't need tenant context
        };
      };

      const handleValidationError = (err: ZodError) => {
        return res.status(400).json({
          success: false,
          error: err.message || "Validation failed",
        });
      };

      const handleResponse = (data: any, status = 200) => {
        return res.status(status).json({ success: true, data });
      };

      const handleError = (err: Error) => {
        if (err instanceof ApiError) {
          return res.status(err.status).json({
            success: false,
            error: err.message,
          });
        }
        return res.status(500).json({
          success: false,
          error: "Internal Server Error",
        });
      };

      // Pick the right handler
      const method = req.method as HttpMethod;
      const handler = this.userHandlers[method];
      if (!handler) {
        return handleError(new ApiError("METHOD_NOT_ALLOWED"));
      }

      // Parse & validate
      const schema = this.schemas?.[method];
      try {
        const raw =
          method === "GET" ? req.query : { ...req.body, ...req.query };
        requestData = schema ? schema.parse(raw) : raw;
      } catch (err) {
        if (err instanceof ZodError) {
          return handleValidationError(err);
        }
        throw err;
      }

      const apiUser = await getApiUser();
      if (!apiUser.id) {
        return handleError(new ApiError("UNAUTHORIZED"));
      }

      // Build the user utilities object
      const utils: UserApiUtilities = {
        supabaseUserClient: supabaseClient,
        dangerSupabaseAdmin: danger_supabaseAdmin,
        requestData,
        apiUser,
        handleValidationError,
        handleError,
      };

      // Run the handler
      try {
        const result = (await handler(utils)) || null;
        return handleResponse(result);
      } catch (err) {
        console.error(err);
        return handleError(err as Error);
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Internal Server Error",
      });
    }
  }
}

/**
 * API Service for tenant-scoped endpoints that extract tenant from URL path
 * Supports both /api/tenants/[tenantSlug]/... and /api/tenants/[tenantId]/... patterns
 */
export class PathTenantApiService<SM extends SchemaMap> extends ApiService<SM> {
  constructor(
    private tenantHandlers: TenantApiHandlers<SM>,
    schemas?: SM,
    private options: {
      paramName?: string; // Default: 'tenantSlug'
      lookupBy?: "slug" | "id"; // Default: 'slug'
    } = {}
  ) {
    // Convert tenant handlers to regular handlers for the parent class
    const regularHandlers: ApiHandlers<SM> = {};
    Object.entries(tenantHandlers).forEach(([method, handler]) => {
      regularHandlers[method as HttpMethod] = handler as Handler<any>;
    });
    super(regularHandlers, schemas);
  }

  public async run(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
  ) {
    try {
      const paramName = this.options.paramName || "tenantSlug";
      const lookupBy = this.options.lookupBy || "slug";

      // Extract tenant identifier from URL path
      const tenantIdentifier = req.query[paramName] as string;
      if (!tenantIdentifier) {
        return res.status(400).json({
          success: false,
          error: `Tenant ${paramName} is required in URL path`,
        });
      }

      // Initialize Supabase client
      const supabaseClient = createServerClient(req, res);
      let requestData: any;

      const getApiUser = async () => {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        return {
          id: user?.id || "",
          email: user?.email || "",
          name: user?.user_metadata.name || "",
        };
      };

      // Get user first for tenant lookup
      const apiUser = await getApiUser();
      if (!apiUser.id) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      // Look up tenant and get tenant ID
      const tenantService = TenantService.create(
        danger_supabaseAdmin,
        apiUser.id
      );
      let tenant;
      let tenantId: string;
      let tenantSlug: string;

      if (lookupBy === "slug") {
        tenant = await tenantService.getTenantBySlug(tenantIdentifier);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: "Tenant not found or access denied",
          });
        }
        tenantId = tenant.id;
        tenantSlug = tenant.slug;
      } else {
        // lookupBy === 'id'
        tenant = await tenantService.getTenantById(tenantIdentifier);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: "Tenant not found or access denied",
          });
        }
        tenantId = tenant.id;
        tenantSlug = tenant.slug;
      }

      const handleValidationError = (err: ZodError) => {
        return res.status(400).json({
          success: false,
          error: err.message || "Validation failed",
        });
      };

      const handleResponse = (data: any, status = 200) => {
        return res.status(status).json({ success: true, data });
      };

      const handleError = (err: Error) => {
        if (err instanceof ApiError) {
          return res.status(err.status).json({
            success: false,
            error: err.message,
          });
        }
        return res.status(500).json({
          success: false,
          error: "Internal Server Error",
        });
      };

      // Pick the right handler
      const method = req.method as HttpMethod;
      const handler = this.tenantHandlers[method];
      if (!handler) {
        return handleError(new ApiError("METHOD_NOT_ALLOWED"));
      }

      // Parse & validate
      const schema = this.schemas?.[method];
      try {
        const raw =
          method === "GET" ? req.query : { ...req.body, ...req.query };
        requestData = schema ? schema.parse(raw) : raw;
      } catch (err) {
        if (err instanceof ZodError) {
          return handleValidationError(err);
        }
        throw err;
      }

      // Build the enhanced utilities object with tenantId and tenantSlug
      const utils: TenantApiUtilities = {
        supabaseUserClient: supabaseClient,
        dangerSupabaseAdmin: danger_supabaseAdmin,
        requestData,
        apiUser,
        tenantId,
        tenantSlug,
        handleValidationError,
        handleError,
      };

      // Run the handler
      try {
        const result = (await handler(utils)) || null;
        return handleResponse(result);
      } catch (err) {
        console.error(err);
        return handleError(err as Error);
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Internal Server Error",
      });
    }
  }
}
