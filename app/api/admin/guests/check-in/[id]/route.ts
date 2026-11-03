import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/permissions/roles";
import { GuestCheckInService } from "@/lib/services/guest-check-in.service";

type Params = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Error";
  const status =
    message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Reverses a mistaken check-in. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(null, "events:checkin");
    const { id } = await params;

    const result = await GuestCheckInService.undo({
      checkInId: id,
      actor: { id: user.id, label: user.name },
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.code, message: result.message },
        { status: result.status }
      );
    }

    revalidatePath("/staff/check-in");
    revalidatePath("/admin/guests");

    return NextResponse.json({ success: true, data: { message: result.message } });
  } catch (error) {
    return errorResponse(error);
  }
}
