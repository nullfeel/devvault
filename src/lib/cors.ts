import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/**
 * Adds CORS headers to any NextResponse.
 */
export function corsResponse(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Creates a JSON NextResponse with CORS headers already applied.
 */
export function corsJson(data: unknown, init?: { status?: number }): NextResponse {
  const response = NextResponse.json(data, init);
  return corsResponse(response);
}

/**
 * Returns a preflight OPTIONS response with CORS headers.
 */
export function corsOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
