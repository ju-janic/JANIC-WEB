import { NextRequest, NextResponse } from "next/server";
import { TeamRepository } from "@/repositories/team.repository";
import { requireAuth } from "@/lib/permissions/roles";
import { revalidatePath } from "next/cache";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(null, "team:update");
    const { id } = await params;
    const body = await req.json();

    const updated = await TeamRepository.update(id, body);
    revalidatePath("/about");
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
    await requireAuth(null, "team:update");
    const { id } = await params;

    await TeamRepository.delete(id);
    revalidatePath("/about");
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
