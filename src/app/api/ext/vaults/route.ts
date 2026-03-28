import { prisma } from "@/lib/prisma";
import { verifyExtToken } from "@/lib/ext-auth";
import { corsJson, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: Request) {
  try {
    const auth = verifyExtToken(request);

    if (!auth) {
      return corsJson({ error: "Unauthorized" }, { status: 401 });
    }

    const vaults = await prisma.vault.findMany({
      where: { userId: auth.userId },
      include: {
        _count: {
          select: { secrets: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return corsJson(vaults);
  } catch (error) {
    console.error("Extension vaults error:", error);
    return corsJson(
      { error: "Failed to fetch vaults" },
      { status: 500 }
    );
  }
}
