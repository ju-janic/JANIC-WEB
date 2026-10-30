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

const projectSchema = z.object({
  title: z.string().min(2, "Title is required"),
  category: z.string().min(2, "Category is required"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  problem: z.string().min(10, "Problem description is required"),
  solution: z.string().min(10, "Solution description is required"),
  technology: z.string().min(2, "Technologies are required"),
  innovation: z.string().optional().nullable(),
  outcomes: z.string().optional().nullable(),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  isFeatured: z.boolean().default(false),
  heroImage: z.string().optional().nullable(),
  demoUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  teamMembers: z.string().optional().nullable(),
  order: z.number().default(0),
  galleryImages: z.array(z.string()).optional(),
  members: z.array(memberItemSchema).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const statusParam = searchParams.get("status");
    const search = searchParams.get("q") || undefined;

    let status: ContentStatus | undefined;
    if (statusParam && Object.values(ContentStatus).includes(statusParam as ContentStatus)) {
      status = statusParam as ContentStatus;
    }

    const result = await ProjectService.getAllAdmin({
      category,
      status,
      search,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch projects";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Role verification
    const current = await requireAuth(null, "projects:update");

    // 2. Input validation
    const body = await req.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    if (parsed.data.status === ContentStatus.PUBLISHED) {
      const { hasPermission } = await import("@/lib/permissions/roles");
      const canPublish = await hasPermission(current.role, "projects:update");
      if (!canPublish) {
        return NextResponse.json({ success: false, error: "You do not have permission to publish content" }, { status: 403 });
      }
    }

    // 3. Service execution
    const project = await ProjectService.createProject(parsed.data as any);

    revalidatePath("/projects");
    revalidatePath("/");
    if (project?.slug) {
      revalidatePath(`/projects/${project.slug}`);
    }

    return NextResponse.json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating project";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
