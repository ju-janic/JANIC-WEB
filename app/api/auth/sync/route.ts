import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { UserRepository } from "@/repositories/user.repository";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signAuthToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";

// Behind nginx, req.url points to the internal address (localhost:3002).
// Build redirect URLs from the real public domain instead.
function getPublicOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (configured && /^https?:\/\//.test(configured) && !configured.includes("localhost")) {
    return configured;
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host && !host.startsWith("localhost")) {
    return `${proto}://${host}`;
  }
  return req.nextUrl.origin;
}

function toPublicUrl(path: string, req: NextRequest): URL {
  return new URL(path, getPublicOrigin(req));
}

async function syncUser(req: NextRequest, isRedirect: boolean) {
  try {
    const body = req.method === "POST" ? await req.json().catch(() => null) : null;
    let clerkUser = null;
    try {
      clerkUser = await currentUser();
    } catch {
      clerkUser = null;
    }

    const email =
      clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() ||
      body?.email?.toLowerCase().trim();

    if (!email) {
      if (isRedirect) return NextResponse.redirect(toPublicUrl("/", req));
      return NextResponse.json({ success: false, error: "No email found" }, { status: 400 });
    }

    const name =
      clerkUser?.fullName?.trim() ||
      `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
      clerkUser?.username ||
      body?.name?.trim() ||
      "Member";

    const avatar = clerkUser?.imageUrl || body?.avatar || null;
    const preferredUsername = clerkUser?.username || body?.username;

    let dbUser = await UserRepository.findByEmail(email);

    if (!dbUser) {
      // Determine unique username
      let baseUsername = (preferredUsername || email.split("@")[0] || "user")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9_.-]/g, "");
      if (baseUsername.length < 3) baseUsername = `user_${baseUsername}`;

      let username = baseUsername;
      let counter = 1;
      while (await UserRepository.findByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Generate secure random password hash
      const randomPassword = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      // Record new user in the database users table!
      dbUser = await UserRepository.create({
        email,
        username,
        passwordHash,
        name,
        role: Role.USER,
        avatar: avatar || undefined,
      });

      console.log(`[AUTH-SYNC] Successfully recorded new OAuth user into database: ${dbUser.email} (@${dbUser.username})`);
    } else if (avatar && !dbUser.avatar) {
      await UserRepository.update(dbUser.id, { avatar });
    }

    // Sign session token
    const token = await signAuthToken({
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      name: dbUser.name,
      role: dbUser.role,
      avatar: dbUser.avatar,
    });

    if (isRedirect) {
      const response = NextResponse.redirect(toPublicUrl("/", req));
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });
      return response;
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("[AUTH-SYNC] Error syncing user to database:", error);
    if (isRedirect) return NextResponse.redirect(toPublicUrl("/", req));
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return syncUser(req, true);
}

export async function POST(req: NextRequest) {
  return syncUser(req, false);
}
