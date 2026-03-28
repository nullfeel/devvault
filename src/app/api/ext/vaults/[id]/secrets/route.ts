import { prisma } from "@/lib/prisma";
import { verifyExtToken } from "@/lib/ext-auth";
import { corsJson, corsOptions } from "@/lib/cors";
import { encrypt, decrypt } from "@/lib/crypto";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = verifyExtToken(request);

    if (!auth) {
      return corsJson({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify vault ownership
    const vault = await prisma.vault.findFirst({
      where: { id: params.id, userId: auth.userId },
    });

    if (!vault) {
      return corsJson({ error: "Vault not found" }, { status: 404 });
    }

    const secrets = await prisma.secret.findMany({
      where: { vaultId: params.id },
      orderBy: { updatedAt: "desc" },
    });

    // Decrypt values before returning
    const decryptedSecrets = secrets.map((secret) => ({
      ...secret,
      value: decrypt(secret.value),
    }));

    return corsJson(decryptedSecrets);
  } catch (error) {
    console.error("Extension secrets GET error:", error);
    return corsJson(
      { error: "Failed to fetch secrets" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = verifyExtToken(request);

    if (!auth) {
      return corsJson({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify vault ownership
    const vault = await prisma.vault.findFirst({
      where: { id: params.id, userId: auth.userId },
    });

    if (!vault) {
      return corsJson({ error: "Vault not found" }, { status: 404 });
    }

    const body = await request.json();
    const { key, value, type, url } = body;

    if (!key || typeof key !== "string") {
      return corsJson({ error: "Secret key is required" }, { status: 400 });
    }

    if (!value || typeof value !== "string") {
      return corsJson({ error: "Secret value is required" }, { status: 400 });
    }

    const validTypes = ["PASSWORD", "API_KEY", "TOKEN", "ENV_VAR", "OTHER"];
    if (type && !validTypes.includes(type)) {
      return corsJson(
        { error: `Invalid secret type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const encryptedValue = encrypt(value);

    const secret = await prisma.secret.create({
      data: {
        key,
        value: encryptedValue,
        type: type || "OTHER",
        vaultId: params.id,
        ...(url ? { url } : {}),
      },
    });

    return corsJson(
      { ...secret, value },
      { status: 201 }
    );
  } catch (error) {
    console.error("Extension secrets POST error:", error);
    return corsJson(
      { error: "Failed to create secret" },
      { status: 500 }
    );
  }
}
