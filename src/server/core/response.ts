import { NextResponse } from "next/server";

import type { ApiResponse } from "@/shared/types/api.types";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "./errors";

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>({ data, error: null }, { status });
}

export function apiError(message: string, status = 500): NextResponse<ApiResponse<never>> {
  return NextResponse.json<ApiResponse<never>>({ data: null, error: message }, { status });
}

// Maps typed errors from service/policy/workflow layers to HTTP responses.
// Unknown errors are logged as 500 without leaking internal details.
export function handleRouteError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof BadRequestError) {
    return apiError(error.message, 400);
  }
  if (error instanceof UnauthorizedError) {
    return apiError(error.message, 401);
  }
  if (error instanceof ForbiddenError) {
    return apiError(error.message, 403);
  }
  if (error instanceof NotFoundError) {
    return apiError(error.message, 404);
  }
  if (error instanceof ConflictError) {
    return apiError(error.message, 409);
  }
  return apiError("Internal server error", 500);
}
