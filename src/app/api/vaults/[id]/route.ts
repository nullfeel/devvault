import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

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

    const vault = await prisma.vault.findFirst({
      where: { id: params.id, userId },
      include: { secrets: true },
    });

    if (!vault) {
      return NextResponse.json(
        { error: "Vault not found" },
        { status: 404 }
      );
    }

    // Decrypt secret values before returning
    const decryptedSecrets = vault.secrets.map((secret) => ({
      ...secret,
      value: decrypt(secret.value),
    }));

    return NextResponse.json({
      ...vault,
      secrets: decryptedSecrets,
    });
  } catch (error) {
    console.error("Error fetching vault:", error);
    return NextResponse.json(
      { error: "Failed to fetch vault" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json();
    const { name, description, icon } = body;

    // Verify ownership
    const existing = await prisma.vault.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Vault not found" },
        { status: 404 }
      );
    }

    const vault = await prisma.vault.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
      },
    });

    return NextResponse.json(vault);
  } catch (error) {
    console.error("Error updating vault:", error);
    return NextResponse.json(
      { error: "Failed to update vault" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify ownership
    const existing = await prisma.vault.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Vault not found" },
        { status: 404 }
      );
    }

    // Cascade delete handles secrets automatically
    await prisma.vault.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Vault deleted successfully" });
  } catch (error) {
    console.error("Error deleting vault:", error);
    return NextResponse.json(
      { error: "Failed to delete vault" },
      { status: 500 }
    );
  }
}
