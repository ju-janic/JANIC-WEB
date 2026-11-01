import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/permissions/roles";
import { ProjectCategoryRepository } from "@/repositories/project-category.repository";
import { revalidatePath } from "next/cache";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(60, "Name is too long"),
  description: z.string().max(300, "Description is too long").optional().nullable(),
});

const updateCategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
  name: z.string().min(1, "Category name is required").max(60, "Name is too long"),
  description: z.string().max(300, "Description is too long").optional().nullable(),
});

export async function GET() {
  try {
    const [categories, names] = await Promise.all([
      ProjectCategoryRepository.getAllWithCounts(),
      ProjectCategoryRepository.getCategoryNames(),
    ]);

    return NextResponse.json({
      success: true,
      categories,
      names,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch project categories";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(null, "projects:update");

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const created = await ProjectCategoryRepository.create(parsed.data);
    const [categories, names] = await Promise.all([
      ProjectCategoryRepository.getAllWithCounts(),
      ProjectCategoryRepository.getCategoryNames(),
    ]);

    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    revalidatePath("/project-members");

    return NextResponse.json({
      success: true,
      message: `Category "${created.name}" created successfully`,
      category: created,
      categories,
      names,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating category";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth(null, "projects:update");

    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const result = await ProjectCategoryRepository.update(parsed.data.id, {
      name: parsed.data.name,
      description: parsed.data.description,
    });

    const [categories, names] = await Promise.all([
      ProjectCategoryRepository.getAllWithCounts(),
      ProjectCategoryRepository.getCategoryNames(),
    ]);

    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    revalidatePath("/project-members");

    return NextResponse.json({
      success: true,
      message: `Category updated successfully${result.affectedProjects > 0 ? ` (${result.affectedProjects} project(s) updated)` : ""}`,
      category: result.category,
      affectedProjects: result.affectedProjects,
      categories,
      names,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating category";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(null, "projects:update");

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });
    }

    const deleted = await ProjectCategoryRepository.delete(id);
    const [categories, names] = await Promise.all([
      ProjectCategoryRepository.getAllWithCounts(),
      ProjectCategoryRepository.getCategoryNames(),
    ]);

    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    revalidatePath("/project-members");

    return NextResponse.json({
      success: true,
      message: `Category "${deleted.name}" deleted successfully`,
      category: deleted,
      categories,
      names,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting category";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

