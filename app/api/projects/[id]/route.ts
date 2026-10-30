/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProjectService } from "@/services/projects/project.service";
import { requireAuth } from "@/lib/permissions/roles";
import { ContentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const memberItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Member name is required"),
  role: z.string().optional().default("Team Member"),
  department: z.string().optional().default("Faculty of Computer Science & IT"),
  bio: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});

const projectUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  summary: z.string().min(10).optional(),
  problem: z.string().min(10).optional(),
  solution: z.string().min(10).optional(),
  technology: z.string().min(2).optional(),
  innovation: z.string().optional().nullable(),
  outcomes: z.string().optional().nullable(),
  status: z.nativeEnum(ContentStatus).optional(),
  isFeatured: z.boolean().optional(),
  heroImage: z.string().optional().nullable(),
  demoUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  teamMembers: z.string().optional().nullable(),
  order: z.number().optional(),
  galleryImages: z.array(z.string()).optional(),
  members: z.array(memberItemSchema).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(null, "projects:update");
    const { id } = await params;
    const body = await req.json();

    const parsed = projectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const updated = await ProjectService.updateProject(id, parsed.data as any);

    revalidatePath("/projects");
    revalidatePath("/");
    if (updated?.slug) {
      revalidatePath(`/projects/${updated.slug}`);
    }

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating project";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(null, "projects:update");
    const { id } = await params;

    await ProjectService.deleteProject(id);

    revalidatePath("/projects");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting project";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
