import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/permissions/roles";
import { SponsorService } from "@/services/sponsors/sponsor.service";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(null, "partnerships:update");
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = { ...body };
    if (body.isApproved !== undefined || body.isRejected !== undefined) {
      data.status = body.isApproved ? "APPROVED" : body.isRejected ? "REJECTED" : "PENDING";
    }

    const updated = await SponsorService.update(id, data);

    revalidatePath("/sponsors");
    revalidatePath("/admin/sponsors");

    return NextResponse.json({ success: true, item: updated });
  } catch (err) {
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
    await requireAuth(null, "partnerships:update");
    const { id } = await params;

    await SponsorService.delete(id);
    revalidatePath("/sponsors");
    revalidatePath("/admin/sponsors");

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
