import { NextRequest, NextResponse } from "next/server";
import { EventService } from "@/services/events/event.service";
import { requireAuth } from "@/lib/permissions/roles";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(null, "events:update");
    const { id } = await params;
    const body = await req.json();

    if (body.eventDate) body.eventDate = new Date(body.eventDate);
    if (body.endDate) {
      body.endDate = new Date(body.endDate);
    } else {
      body.endDate = null;
    }

    const updated = await EventService.updateEvent(id, body);
    return NextResponse.json({ success: true, item: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(null, "events:update");
    const { id } = await params;

    await EventService.deleteEvent(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
