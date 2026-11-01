import prisma from "@/lib/db/prisma";
import { SettingRepository } from "./setting.repository";

export interface ProjectCategoryRecord {
  id: string;
  name: string;
  description?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCategoryWithCount extends ProjectCategoryRecord {
  projectCount: number;
}

const SETTINGS_KEY = "project_categories";

const DEFAULT_CATEGORIES: Array<{ name: string; description: string }> = [
  { name: "Web Platform", description: "Web applications, portals, and full-stack cloud software" },
  { name: "HealthTech", description: "Healthcare diagnostics, patient triage, and clinical systems" },
  { name: "Mobile & Cloud", description: "Native and cross-platform mobile apps and cloud architectures" },
  { name: "AgriTech", description: "Agricultural supply chain, farmer marketplaces, and rural commerce" },
  { name: "Robotics", description: "Autonomous robotics, obstacle avoidance, and motorized cleaning" },
  { name: "IoT & Hardware", description: "Sensor networks, embedded microcontrollers, and smart devices" },
  { name: "IoT & Automation", description: "Smart home, industrial automation, and wireless control" },
  { name: "Information Systems", description: "Institutional registrar databases, storage optimization, and file security" },
  { name: "Branding & Design", description: "Visual identity, typography architecture, and corporate design guidelines" },
  { name: "Digital Media", description: "Video editing, cinematic documentary production, and digital storytelling" },
  { name: "Enterprise Software", description: "Fuel management, inventory control, and enterprise accounting systems" },
  { name: "FinTech", description: "Democratized investment matching, micro-business funding, and mobile finance" },
];

export class ProjectCategoryRepository {
  /**
   * Retrieve all project categories.
   * If not yet seeded in SiteSetting, initializes with default categories merged with any distinct categories in the DB.
   */
  static async getAll(): Promise<ProjectCategoryRecord[]> {
    const setting = await SettingRepository.getByKey(SETTINGS_KEY);

    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
        }
      } catch (e) {
        console.warn("Failed to parse project_categories from SiteSetting:", e);
      }
    }

    // Initialize with defaults and any distinct categories from existing projects
    const existingProjects = await prisma.project.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    const categorySet = new Set<string>();
    const initialList: ProjectCategoryRecord[] = [];
    const now = new Date().toISOString();

    // 1. Add existing project categories
    existingProjects.forEach((p, idx) => {
      const name = p.category.trim();
      if (name && !categorySet.has(name.toLowerCase())) {
        categorySet.add(name.toLowerCase());
        initialList.push({
          id: `cat_${Date.now()}_${idx}`,
          name,
          description: DEFAULT_CATEGORIES.find((d) => d.name.toLowerCase() === name.toLowerCase())?.description || null,
          order: idx + 1,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    // 2. Add standard default categories
    DEFAULT_CATEGORIES.forEach((def) => {
      if (!categorySet.has(def.name.toLowerCase())) {
        categorySet.add(def.name.toLowerCase());
        initialList.push({
          id: `cat_${Date.now()}_${initialList.length}`,
          name: def.name,
          description: def.description,
          order: initialList.length + 1,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    // Save initial list
    await SettingRepository.upsert(SETTINGS_KEY, JSON.stringify(initialList), "projects");
    return initialList.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }

  /**
   * Retrieve categories with real-time project counts.
   */
  static async getAllWithCounts(): Promise<ProjectCategoryWithCount[]> {
    const [categories, projectCounts] = await Promise.all([
      this.getAll(),
      prisma.project.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
    ]);

    const countMap = new Map<string, number>();
    projectCounts.forEach((pc) => {
      countMap.set(pc.category.trim().toLowerCase(), pc._count._all);
    });

    return categories.map((cat) => ({
      ...cat,
      projectCount: countMap.get(cat.name.trim().toLowerCase()) || 0,
    }));
  }

  /**
   * Return array of category name strings.
   */
  static async getCategoryNames(): Promise<string[]> {
    const categories = await this.getAll();
    return categories.map((c) => c.name);
  }

  /**
   * Create a new category.
   */
  static async create(data: { name: string; description?: string | null }): Promise<ProjectCategoryRecord> {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new Error("Category name is required");
    }

    const categories = await this.getAll();
    const exists = categories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      throw new Error(`Category "${trimmedName}" already exists`);
    }

    const now = new Date().toISOString();
    const newCategory: ProjectCategoryRecord = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      description: data.description?.trim() || null,
      order: categories.length + 1,
      createdAt: now,
      updatedAt: now,
    };

    categories.push(newCategory);
    await SettingRepository.upsert(SETTINGS_KEY, JSON.stringify(categories), "projects");
    return newCategory;
  }

  /**
   * Update category name and/or description.
   * If name changes, propagates the change to all projects using the old name!
   */
  static async update(
    id: string,
    data: { name: string; description?: string | null }
  ): Promise<{ category: ProjectCategoryRecord; affectedProjects: number }> {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new Error("Category name is required");
    }

    const categories = await this.getAll();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Category not found");
    }

    const currentCat = categories[index];
    const nameChanged = currentCat.name.toLowerCase() !== trimmedName.toLowerCase();

    if (nameChanged) {
      const duplicate = categories.some((c) => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase());
      if (duplicate) {
        throw new Error(`Category "${trimmedName}" already exists`);
      }
    }

    let affectedProjects = 0;
    if (nameChanged) {
      // Update all projects with old category name in database
      const updateResult = await prisma.project.updateMany({
        where: { category: currentCat.name },
        data: { category: trimmedName },
      });
      affectedProjects = updateResult.count;
    }

    const updatedCategory: ProjectCategoryRecord = {
      ...currentCat,
      name: trimmedName,
      description: data.description !== undefined ? data.description?.trim() || null : currentCat.description,
      updatedAt: new Date().toISOString(),
    };

    categories[index] = updatedCategory;
    await SettingRepository.upsert(SETTINGS_KEY, JSON.stringify(categories), "projects");

    return { category: updatedCategory, affectedProjects };
  }

  /**
   * Delete category.
   * Validates that no projects are currently assigned to this category.
   */
  static async delete(id: string): Promise<ProjectCategoryRecord> {
    const categories = await this.getAll();
    const category = categories.find((c) => c.id === id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if any projects are currently assigned to this category
    const projectCount = await prisma.project.count({
      where: { category: category.name },
    });

    if (projectCount > 0) {
      throw new Error(
        `Cannot delete "${category.name}" because ${projectCount} project(s) are currently assigned to it. Please reassign those projects before deleting.`
      );
    }

    const filtered = categories.filter((c) => c.id !== id);
    await SettingRepository.upsert(SETTINGS_KEY, JSON.stringify(filtered), "projects");
    return category;
  }
}

