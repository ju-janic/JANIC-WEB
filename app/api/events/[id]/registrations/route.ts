import { NextRequest, NextResponse } from "next/server";
import { GuestRegistrationService } from "@/lib/services/guest-registration.service";
import { getCurrentUser } from "@/lib/auth/jwt";

type Params = { params: Promise<{ id: string }> };

const MAX_BODY_BYTES = 32 * 1024;

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return (
    req.headers.get("x-real-ip")?.trim().slice(0, 64) ||
    req.headers.get("cf-connecting-ip")?.trim().slice(0, 64) ||
    null
  );
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    // The dynamic segment is named "id" only because /api/events/[id] already
    // owns this path level in Next.js; the value is the event slug.
    const { id: slug } = await params;

    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          message: "The submitted form is too large.",
        },
        { status: 413 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          message: "The submitted form could not be read. Please try again.",
        },
        { status: 400 }
      );
    }

    // A signed-in JANIC user is linked to the registration so the future
    // "My Event Registration" profile section can find it. Guests continue
    // without an account.
    const user = await getCurrentUser().catch(() => null);

    const result = await GuestRegistrationService.register(slug, body, {
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent")?.slice(0, 512) ?? null,
      userId: user?.id ?? null,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.code,
          message: result.message,
          fieldErrors: result.fieldErrors ?? undefined,
        },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...result.receipt,
          confirmationToken: result.confirmationToken,
          confirmationUrl: `/events/${slug}/register/confirmation?token=${encodeURIComponent(
            result.confirmationToken
          )}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[guest-registration] unhandled error", error);
    return NextResponse.json(
      {
        success: false,
        error: "SERVER_ERROR",
        message:
          "We could not process your registration right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
