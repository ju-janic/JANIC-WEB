import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/permissions/roles";
import { clientIp } from "@/lib/http/client-ip";
import { GuestModerationService } from "@/lib/services/guest-moderation.service";

type Params = { params: Promise<{ id: string }> };

const rejectSchema = z.object({
  reason: z.string().trim().max(1000).optional().nullable(),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(null, "events:update");
    const { id } = await params;

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT", message: "The rejection reason is too long." },
        { status: 400 }
      );
    }

    const result = await GuestModerationService.reject({
      id,
      actor: { id: user.id, label: user.name },
      reason: parsed.data.reason ?? null,
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

    return NextResponse.json({ success: true, data: { message: result.message } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
