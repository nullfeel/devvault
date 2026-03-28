import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

async function verifySecretOwnership(secretId: string, vaultId: string, userId: string) {
  const secret = await prisma.secret.findFirst({
    where: {
      id: secretId,
      vaultId,
      vault: { userId },
    },
  });
  return secret;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; secretId: string } }
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

    const existing = await verifySecretOwnership(params.secretId, params.id, userId);

    if (!existing) {
      return NextResponse.json(
        { error: "Secret not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { key, value, type } = body;

    const validTypes = ["PASSWORD", "API_KEY", "TOKEN", "ENV_VAR", "OTHER"];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid secret type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Re-encrypt value if it's being updated
    const updateData: Record<string, string> = {};
    if (key !== undefined) updateData.key = key;
    if (value !== undefined) updateData.value = encrypt(value);
    if (type !== undefined) updateData.type = type;

    const secret = await prisma.secret.update({
      where: { id: params.secretId },
      data: updateData,
    });

    return NextResponse.json({
      ...secret,
      value: value !== undefined ? value : undefined,
    });
  } catch (error) {
    console.error("Error updating secret:", error);
    return NextResponse.json(
      { error: "Failed to update secret" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; secretId: string } }
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

    const existing = await verifySecretOwnership(params.secretId, params.id, userId);

    if (!existing) {
      return NextResponse.json(
        { error: "Secret not found" },
        { status: 404 }
      );
    }

    await prisma.secret.delete({
      where: { id: params.secretId },
    });

    return NextResponse.json({ message: "Secret deleted successfully" });
  } catch (error) {
    console.error("Error deleting secret:", error);
    return NextResponse.json(
      { error: "Failed to delete secret" },
      { status: 500 }
    );
  }
}
