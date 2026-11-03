import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/permissions/roles";
import { GuestCheckInService } from "@/lib/services/guest-check-in.service";

const scanSchema = z.object({
  code: z.string().trim().min(1).max(512),
});

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Error";
  const status =
    message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Read-only verification of a scanned invitation. */
export async function POST(req: NextRequest) {
  try {
    await requireAuth(null, "events:checkin");

    const body = await req.json().catch(() => null);
    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          message: "Scan a QR code or type a guest ID / registration reference.",
        },
        { status: 400 }
      );
    }

    const result = await GuestCheckInService.scan(parsed.data.code);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
