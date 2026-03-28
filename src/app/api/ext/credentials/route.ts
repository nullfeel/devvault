import { prisma } from "@/lib/prisma";
import { verifyExtToken } from "@/lib/ext-auth";
import { corsJson, corsOptions } from "@/lib/cors";
import { encrypt, decrypt } from "@/lib/crypto";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: Request) {
  try {
    const auth = verifyExtToken(request);

    if (!auth) {
      return corsJson({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return corsJson(
        { error: "url query parameter is required" },
        { status: 400 }
      );
    }

    // Find all vaults belonging to the user
    const vaults = await prisma.vault.findMany({
      where: { userId: auth.userId },
      select: { id: true },
    });

    const vaultIds = vaults.map((v) => v.id);

    // Search secrets where key or url contains the search URL
    const secrets = await prisma.secret.findMany({
      where: {
        vaultId: { in: vaultIds },
        OR: [
          { key: { contains: url } },
          { url: { contains: url } },
        ],
      },
      include: {
        vault: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Decrypt values before returning
    const decryptedSecrets = secrets.map((secret) => ({
      ...secret,
      value: decrypt(secret.value),
    }));

    return corsJson(decryptedSecrets);
  } catch (error) {
    console.error("Extension credentials GET error:", error);
    return corsJson(
      { error: "Failed to search credentials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = verifyExtToken(request);

    if (!auth) {
      return corsJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, username, password, vaultId } = body;

    if (!url || !username || !password) {
      return corsJson(
        { error: "url, username, and password are required" },
        { status: 400 }
      );
    }

    let targetVaultId = vaultId;

    // If no vaultId provided, find or create a default "Passwords" vault
    if (!targetVaultId) {
      let defaultVault = await prisma.vault.findFirst({
        where: { userId: auth.userId, name: "Passwords" },
      });

      if (!defaultVault) {
        defaultVault = await prisma.vault.create({
          data: {
            name: "Passwords",
            description: "Auto-created vault for browser extension passwords",
            icon: "🔑",
            userId: auth.userId,
          },
        });
      }

      targetVaultId = defaultVault.id;
    } else {
      // Verify vault ownership
      const vault = await prisma.vault.findFirst({
        where: { id: targetVaultId, userId: auth.userId },
      });

      if (!vault) {
        return corsJson({ error: "Vault not found" }, { status: 404 });
      }
    }

    const credentialValue = JSON.stringify({ username, password });
    const encryptedValue = encrypt(credentialValue);

    const secret = await prisma.secret.create({
      data: {
        key: url,
        value: encryptedValue,
        type: "PASSWORD",
        url,
        vaultId: targetVaultId,
      },
    });

    return corsJson(
      { ...secret, value: credentialValue },
      { status: 201 }
    );
  } catch (error) {
    console.error("Extension credentials POST error:", error);
    return corsJson(
      { error: "Failed to save credential" },
      { status: 500 }
    );
  }
}
