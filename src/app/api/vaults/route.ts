import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    const vaults = await prisma.vault.findMany({
      where: { userId },
      include: {
        _count: {
          select: { secrets: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(vaults);
  } catch (error) {
    console.error("Error fetching vaults:", error);
    return NextResponse.json(
      { error: "Failed to fetch vaults" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Vault name is required" },
        { status: 400 }
      );
    }

    const vault = await prisma.vault.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        userId,
      },
    });

    return NextResponse.json(vault, { status: 201 });
  } catch (error) {
    console.error("Error creating vault:", error);
    return NextResponse.json(
      { error: "Failed to create vault" },
      { status: 500 }
    );
  }
}
