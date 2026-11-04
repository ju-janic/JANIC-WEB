import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/permissions/roles";
import { clientIp } from "@/lib/http/client-ip";
import { GuestEventConfigService } from "@/lib/services/guest-event-config.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(null, "events:update");
    const { id: eventConfigId } = await params;

    const result = await GuestEventConfigService.closeRegistration({
      eventConfigId,
      actor: { id: user.id, label: user.name },
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent")?.slice(0, 512) ?? null,
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "This event registration was not found." },
        { status: 404 }
      );
    }

    revalidatePath("/admin/guests");
    revalidatePath("/account/registrations");

    return NextResponse.json({
      success: true,
      data: {
        eventConfigId: result.id,
        eventName: result.eventName,
        slug: result.slug,
        isActive: result.isActive,
        message: "Guest registration has been closed.",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err : new Error("Error");
    const status = msg.message === "UNAUTHORIZED" ? 401 : msg.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg.message }, { status });
  }
}
