import { NextRequest, NextResponse } from "next/server";
import { SubmissionService } from "@/services/submissions/submission.service";
import { requireAuth } from "@/lib/permissions/roles";
import type { SubmissionStatus } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(null, "submissions:update");
    const { id } = await params;
    const body = await req.json();

    const updated = await SubmissionService.updateStatus(
      id,
      body.status as SubmissionStatus,
      body.reviewNotes
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
    await requireAuth(null, "submissions:update");
    const { id } = await params;

    await SubmissionService.deleteSubmission(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
