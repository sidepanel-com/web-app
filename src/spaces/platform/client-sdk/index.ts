import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { UserTenantsClientAPI } from "./user-tenants.client-api";
import { TenantClientAPI } from "./tenant.client-api";
import { TenantUsersClientAPI } from "./tenant-users.client-api";
import { TenantInvitationsClientAPI } from "./tenant-invitations.client-api";
import { UserProfileClientAPI } from "./user-profile.client-api";
import { InvitationsClientAPI } from "./invitations.client-api";

export interface ApiClientOptions {
  baseUrl?: string;
  accessToken: string;
  timeout?: number;
}

// Match your server response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public response?: AxiosResponse;

  constructor(
    message: string,
    status: number,
    code?: string,
    response?: AxiosResponse
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.response = response;
  }

  // Helper methods
  static isValidationError = (error: ApiError) =>
    error.status === 422 || error.code === "VALIDATION_ERROR";
  static isAuthError = (error: ApiError) =>
    error.status === 401 || error.code === "UNAUTHORIZED";
  static isForbiddenError = (error: ApiError) =>
    error.status === 403 || error.code === "FORBIDDEN";
  static isNotFoundError = (error: ApiError) =>
    error.status === 404 || error.code === "NOT_FOUND";
  static isServerError = (error: ApiError) => error.status >= 500;
  static isNetworkError = (error: ApiError) => error.status === 0;
}

export class ApiClient {
  public axios: AxiosInstance;

  constructor(options: ApiClientOptions) {
    // Create axios instance with all configuration
    this.axios = axios.create({
      baseURL: options.baseUrl || "/api",
      timeout: options.timeout || 10000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.accessToken}`,
      },
    });

    // Response interceptor to handle your server's response format
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const axiosError = error;
        const response = axiosError.response;
        const responseData = response?.data as ApiResponse<any>;

        // Transform to ApiError
        const message =
          responseData?.error ||
          responseData?.message ||
          axiosError.message ||
          "Unknown error";
        const status = response?.status || 0;
        const code = responseData?.code || axiosError.code;

        throw new ApiError(message, status, code, response);
      }
    );
  }

  // Simple wrapper methods that return the server response directly
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axios.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axios.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axios.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axios.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axios.delete<ApiResponse<T>>(url, config);
    return response.data;
  }
}

// Helper functions
export const isApiError = (error: any): error is ApiError =>
  error instanceof ApiError;

export const handleApiError = (error: unknown) => {
  if (isApiError(error)) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      isValidationError: ApiError.isValidationError(error),
      isAuthError: ApiError.isAuthError(error),
      isForbiddenError: ApiError.isForbiddenError(error),
      isNotFoundError: ApiError.isNotFoundError(error),
      isServerError: ApiError.isServerError(error),
      isNetworkError: ApiError.isNetworkError(error),
    };
  }

  return {
    message: error instanceof Error ? error.message : "Unknown error",
    status: 500,
    code: "UNKNOWN_ERROR",
    isValidationError: false,
    isAuthError: false,
    isForbiddenError: false,
    isNotFoundError: false,
    isServerError: true,
    isNetworkError: false,
  };
};

// Base SDK interface with common methods
interface BaseClientSDK {
  axios: AxiosInstance;
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ) => Promise<ApiResponse<T>>;
  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ) => Promise<ApiResponse<T>>;
  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ) => Promise<ApiResponse<T>>;
  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ) => Promise<ApiResponse<T>>;
  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ) => Promise<ApiResponse<T>>;
  userTenants: UserTenantsClientAPI;
  userProfile: UserProfileClientAPI;
  invitations: InvitationsClientAPI;
}

// SDK without tenant context - for user-level operations
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UserClientSDK extends BaseClientSDK {}

// SDK with tenant context - includes tenant-specific operations
export interface TenantClientSDK extends BaseClientSDK {
  tenant: TenantClientAPI;
  tenantUsers: TenantUsersClientAPI;
  tenantInvitations: TenantInvitationsClientAPI;
}

// Add AppClientSDK interface
export interface AppClientSDK {
  axios: AxiosInstance;
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ) => Promise<ApiResponse<T>>;
  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ) => Promise<ApiResponse<T>>;
  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ) => Promise<ApiResponse<T>>;
  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ) => Promise<ApiResponse<T>>;
  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ) => Promise<ApiResponse<T>>;
  invitations: InvitationsClientAPI;
  // App-level APIs (no auth required)
  // health: HealthClientAPI; // Future: system health, status
  // public: PublicClientAPI; // Future: public endpoints
}

// Add factory function for AppClientSDK
export function createAppClientSDK(
  options: Omit<ApiClientOptions, "accessToken"> & {
    accessToken?: string;
  }
): AppClientSDK {
  const client = new ApiClient({
    ...options,
    accessToken: options.accessToken || "", // App SDK might not need auth
  });

  return {
    axios: client.axios,
    get: client.get.bind(client),
    post: client.post.bind(client),
    put: client.put.bind(client),
    patch: client.patch.bind(client),
    delete: client.delete.bind(client),
    invitations: new InvitationsClientAPI(client),
  };
}

// Factory functions with proper typing
export function createClientSDK(options: ApiClientOptions): UserClientSDK {
  const client = new ApiClient(options);

  const baseSDK: BaseClientSDK = {
    // Expose axios instance for advanced usage
    axios: client.axios,

    // Convenience methods
    get: client.get.bind(client),
    post: client.post.bind(client),
    put: client.put.bind(client),
    patch: client.patch.bind(client),
    delete: client.delete.bind(client),

    // Domain-specific APIs
    userTenants: new UserTenantsClientAPI(client),
    userProfile: new UserProfileClientAPI(client),
    invitations: new InvitationsClientAPI(client),
  };

  return baseSDK as UserClientSDK;
}

export function createUserClientSDK(options: ApiClientOptions): UserClientSDK {
  return createClientSDK(options);
}

export function createTenantClientSDK(
  options: ApiClientOptions,
  tenantSlug: string
): TenantClientSDK {
  const client = new ApiClient(options);

  const baseSDK: BaseClientSDK = {
    // Expose axios instance for advanced usage
    axios: client.axios,

    // Convenience methods
    get: client.get.bind(client),
    post: client.post.bind(client),
    put: client.put.bind(client),
    patch: client.patch.bind(client),
    delete: client.delete.bind(client),

    // Domain-specific APIs
    userTenants: new UserTenantsClientAPI(client),
    userProfile: new UserProfileClientAPI(client),
    invitations: new InvitationsClientAPI(client),
  };

  return {
    ...baseSDK,
    tenant: new TenantClientAPI(client, tenantSlug),
    tenantUsers: new TenantUsersClientAPI(client, tenantSlug),
    tenantInvitations: new TenantInvitationsClientAPI(client, tenantSlug),
  } as TenantClientSDK;
}
