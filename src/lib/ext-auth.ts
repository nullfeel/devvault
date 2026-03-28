import crypto from "crypto";

interface ExtTokenPayload {
  userId: string;
  email: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not defined");
  }
  return secret;
}

function base64UrlEncode(data: Buffer | string): string {
  const buf = typeof data === "string" ? Buffer.from(data) : data;
  return buf.toString("base64url");
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf-8");
}

/**
 * Creates a signed token with HMAC-SHA256.
 * Format: base64url(payload).base64url(signature)
 */
export function createExtToken(userId: string, email: string): string {
  const payload: ExtTokenPayload = {
    userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };

  const payloadStr = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payloadStr)
    .digest();
  const signatureStr = base64UrlEncode(signature);

  return `${payloadStr}.${signatureStr}`;
}

/**
 * Verifies the extension token from a Request's Authorization header.
 * Returns { userId, email } on success, or null on failure.
 */
export function verifyExtToken(
  request: Request
): { userId: string; email: string } | null {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7);
    const [payloadStr, signatureStr] = token.split(".");

    if (!payloadStr || !signatureStr) {
      return null;
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", getSecret())
      .update(payloadStr)
      .digest();
    const expectedSignatureStr = base64UrlEncode(expectedSignature);

    const sigBuf = Buffer.from(signatureStr);
    const expectedBuf = Buffer.from(expectedSignatureStr);

    if (sigBuf.length !== expectedBuf.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    // Decode and check expiration
    const payload: ExtTokenPayload = JSON.parse(base64UrlDecode(payloadStr));

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}
