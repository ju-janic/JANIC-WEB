import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/permissions/roles";
import { clientIp } from "@/lib/http/client-ip";
import { GuestCheckInService } from "@/lib/services/guest-check-in.service";

const checkInSchema = z.object({
  code: z.string().trim().min(1).max(512),
  notes: z.string().trim().max(500).optional().nullable(),
});

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Error";
  const status =
    message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Verifies the invitation again and records the check-in. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(null, "events:checkin");

    const body = await req.json().catch(() => null);
    const parsed = checkInSchema.safeParse(body);
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

    const result = await GuestCheckInService.checkIn({
      raw: parsed.data.code,
      actor: { id: user.id, label: user.name },
      notes: parsed.data.notes ?? null,
      ipAddress: clientIp(req),
    });

    if (result.state === "CHECKED_IN") {
      revalidatePath("/staff/check-in");
      revalidatePath("/admin/guests");
      revalidatePath(`/admin/guests/${result.guest?.registrationId ?? ""}`);
      revalidatePath("/account/registrations");
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
