import { NextRequest, NextResponse } from "next/server";
import { MessageService } from "@/services/messages/message.service";
import { requireAuth } from "@/lib/permissions/roles";
import type { MessageStatus } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(null, "messages:update");
    const { id } = await params;
    const body = await req.json();

    const updated = await MessageService.updateStatus(
      id,
      body.status as MessageStatus,
      body.adminNotes
    );

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
    await requireAuth(null, "messages:update");
    const { id } = await params;

    await MessageService.deleteMessage(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
