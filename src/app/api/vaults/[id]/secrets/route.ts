import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    // Verify the vault belongs to the user
    const vault = await prisma.vault.findFirst({
      where: { id: params.id, userId },
    });

    if (!vault) {
      return NextResponse.json(
        { error: "Vault not found" },
        { status: 404 }
      );
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

    return NextResponse.json(decryptedSecrets);
  } catch (error) {
    console.error("Error fetching secrets:", error);
    return NextResponse.json(
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
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    // Verify the vault belongs to the user
    const vault = await prisma.vault.findFirst({
      where: { id: params.id, userId },
    });

    if (!vault) {
      return NextResponse.json(
        { error: "Vault not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { key, value, type } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "Secret key is required" },
        { status: 400 }
      );
    }

    if (!value || typeof value !== "string") {
      return NextResponse.json(
        { error: "Secret value is required" },
        { status: 400 }
      );
    }

    const validTypes = ["PASSWORD", "API_KEY", "TOKEN", "ENV_VAR", "OTHER"];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid secret type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Encrypt the value before storing
    const encryptedValue = encrypt(value);

    const secret = await prisma.secret.create({
      data: {
        key,
        value: encryptedValue,
        type: type || "OTHER",
        vaultId: params.id,
      },
    });

    // Return with decrypted value for convenience
    return NextResponse.json(
      { ...secret, value },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating secret:", error);
    return NextResponse.json(
      { error: "Failed to create secret" },
      { status: 500 }
    );
  }
}
