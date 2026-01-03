// lib/apiErrors.ts

/** shape of a single error type */
export interface ErrorType {
  status: number;
  code: string;
  message: string;
}

/** central map of all your API error types */
export const ApiErrorTypes: Record<string, ErrorType> = {
  BAD_REQUEST: {
    status: 400,
    code: "BAD_REQUEST",
    message: "Bad request",
  },
  UNAUTHORIZED: {
    status: 401,
    code: "UNAUTHORIZED",
    message: "Authentication required",
  },
  FORBIDDEN: {
    status: 403,
    code: "FORBIDDEN",
    message: "You do not have permission to access this resource",
  },
  NOT_FOUND: {
    status: 404,
    code: "NOT_FOUND",
    message: "Resource not found",
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    code: "METHOD_NOT_ALLOWED",
    message: "Method not allowed",
  },
  VALIDATION_ERROR: {
    status: 422,
    code: "VALIDATION_ERROR",
    message: "Validation failed",
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  },
};

/**
 * Custom Error subclass that carries an HTTP status + code
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(type: keyof typeof ApiErrorTypes, overrideMessage?: string) {
    const { status, code, message } = ApiErrorTypes[type];
    super(overrideMessage ?? message);
    this.status = status;
    this.code = code;
    // maintain proper instanceof behavior
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
