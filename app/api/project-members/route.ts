import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProjectMemberRepository } from "@/repositories/project-member.repository";
import { requireAuth } from "@/lib/permissions/roles";

const projectMemberSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().default("Team Member"),
  department: z.string().default("Faculty of Computer Science & IT"),
  bio: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const search = searchParams.get("search") || undefined;

    const items = await ProjectMemberRepository.findAll({
      projectId: projectId === "all" ? undefined : projectId,
      search,
    });
    return NextResponse.json({ success: true, items });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(null, "project_members:update");
    const body = await req.json();
    const parsed = projectMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { projectId, ...rest } = parsed.data;

    const createData: Parameters<typeof ProjectMemberRepository.create>[0] = {
      ...rest,
      project: projectId ? { connect: { id: projectId } } : undefined,
    };

    const item = await ProjectMemberRepository.create(createData);
    return NextResponse.json({ success: true, item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
