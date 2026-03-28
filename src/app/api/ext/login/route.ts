import { prisma } from "@/lib/prisma";
import { createExtToken } from "@/lib/ext-auth";
import { corsJson, corsOptions } from "@/lib/cors";
import bcrypt from "bcryptjs";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return corsJson(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return corsJson(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return corsJson(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = createExtToken(user.id, user.email);

    return corsJson({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Extension login error:", error);
    return corsJson(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
