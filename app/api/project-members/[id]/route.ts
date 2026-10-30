import { NextRequest, NextResponse } from "next/server";
import { ProjectMemberRepository } from "@/repositories/project-member.repository";
import { requireAuth } from "@/lib/permissions/roles";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(null, "project_members:update");
    const { id } = await params;
    const body = await req.json();

    const { projectId, ...rest } = body;

    const updateData: Parameters<typeof ProjectMemberRepository.update>[1] = {
      ...rest,
      project: projectId
        ? { connect: { id: projectId } }
        : projectId === null
        ? { disconnect: true }
        : undefined,
    };

    const updated = await ProjectMemberRepository.update(id, updateData);
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
    await requireAuth(null, "project_members:update");
    const { id } = await params;

    await ProjectMemberRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
