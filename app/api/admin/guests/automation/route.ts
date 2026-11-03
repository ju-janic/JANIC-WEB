import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/permissions/roles";
import { clientIp } from "@/lib/http/client-ip";
import { GuestModerationService } from "@/lib/services/guest-moderation.service";

const automationSchema = z.object({
  eventConfigId: z.string().min(1),
  automatic: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(null, "events:update");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT", message: "The request could not be read." },
        { status: 400 }
      );
    }

    const parsed = automationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT", message: "Select an event and a processing mode." },
        { status: 400 }
      );
    }

    const result = await GuestModerationService.setAutomation({
      eventConfigId: parsed.data.eventConfigId,
      automatic: parsed.data.automatic,
      actor: { id: user.id, label: user.name },
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent")?.slice(0, 512) ?? null,
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "This event configuration was not found." },
        { status: 404 }
      );
    }

    revalidatePath("/admin/guests");

    return NextResponse.json({
      success: true,
      data: {
        enabled: result.enabled,
        approvalMode: result.approvalMode,
        message: result.enabled
          ? "Automatic approval is on. New registrations are approved instantly."
          : "Manual approval is on. New registrations wait for review.",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
