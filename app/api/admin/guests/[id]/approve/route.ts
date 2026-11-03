import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/permissions/roles";
import { clientIp } from "@/lib/http/client-ip";
import { GuestModerationService } from "@/lib/services/guest-moderation.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(null, "events:update");
    const { id } = await params;

    const result = await GuestModerationService.approve({
      id,
      actor: { id: user.id, label: user.name },
      ipAddress: clientIp(req),
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.code, message: result.message },
        { status: result.status }
      );
    }

    revalidatePath("/admin/guests");
    revalidatePath(`/admin/guests/${id}`);
    revalidatePath("/account/registrations");

    return NextResponse.json({
      success: true,
      data: {
        guestId: result.guestId,
        alreadyApproved: result.alreadyApproved,
        message: result.message,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
