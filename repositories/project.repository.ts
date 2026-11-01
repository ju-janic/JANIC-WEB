import prisma from "@/lib/db/prisma";
import { ContentStatus, Prisma } from "@prisma/client";
import { ProjectCategoryRepository } from "./project-category.repository";

export class ProjectRepository {
  static async findPublished(options?: {
    category?: string;
    isFeatured?: boolean;
    search?: string;
    limit?: number;
  }) {
    const where: Prisma.ProjectWhereInput = {
      status: ContentStatus.PUBLISHED,
    };

    if (options?.category && options.category !== "all") {
      where.category = { contains: options.category };
    }

    if (options?.isFeatured !== undefined) {
      where.isFeatured = options.isFeatured;
    }

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search } },
        { summary: { contains: options.search } },
        { technology: { contains: options.search } },
      ];
    }

    return prisma.project.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      take: options?.limit,
      include: {
        gallery: { orderBy: { order: "asc" } },
        members: { orderBy: { order: "asc" } },
      } as any,
    });
  }

  static async findBySlug(slug: string) {
    const raw = (slug || "").trim();
    const decoded = decodeURIComponent(raw).trim();
    const slugified = decoded
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-");

    return prisma.project.findFirst({
      where: {
        OR: [
          { slug: raw },
          { slug: decoded },
          { slug: slugified },
          { title: raw },
          { title: decoded },
        ],
      },
      include: {
        gallery: { orderBy: { order: "asc" } },
        members: { orderBy: { order: "asc" } },
      } as any,
    });
  }

  static async findAllAdmin(options?: {
    status?: ContentStatus;
    category?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.ProjectWhereInput = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.category && options.category !== "all") {
      where.category = { contains: options.category };
    }

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search } },
        { summary: { contains: options.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: options?.skip,
        take: options?.take,
        include: {
          gallery: true,
          members: { orderBy: { order: "asc" } },
        } as any,
      }),
      prisma.project.count({ where }),
    ]);

    return { items, total };
  }

  static async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        gallery: { orderBy: { order: "asc" } },
        members: { orderBy: { order: "asc" } },
      } as any,
    });
  }

  static async create(data: Prisma.ProjectCreateInput) {
    return prisma.project.create({ data });
  }

  static async update(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.project.delete({
      where: { id },
    });
  }

  static async getCategories() {
    return ProjectCategoryRepository.getCategoryNames();
  }
}
