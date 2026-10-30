import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/permissions/roles";
import fs from "fs";
import path from "path";

// GET /api/media - Fetch all media with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder");
    const query = searchParams.get("q");

    const where: Record<string, unknown> = {};

    if (folder && folder !== "all") {
      where.folder = folder;
    }

    if (query) {
      where.OR = [
        { fileName: { contains: query } },
        { alt: { contains: query } },
        { folder: { contains: query } },
      ];
    }

    const media = await prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, media });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching media";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/media - Bulk actions (bulk delete, bulk folder update)
export async function POST(req: NextRequest) {
  try {
    await requireAuth(null, "media:update");
    const body = await req.json();
    const { action, ids, folder } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "No media IDs provided" }, { status: 400 });
    }

    if (action === "bulk-delete") {
      const items = await prisma.media.findMany({
        where: { id: { in: ids } },
      });

      // Delete records from database
      await prisma.media.deleteMany({
        where: { id: { in: ids } },
      });

      // Clean up files on disk
      for (const item of items) {
        if (item.url.startsWith("/uploads/")) {
          const filePath = path.join(process.cwd(), "public", item.url);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch {
              // Ignore if unlinking fails
            }
          }
        }
      }

      return NextResponse.json({ success: true, deletedCount: items.length });
    }

    if (action === "bulk-move" && folder) {
      const updated = await prisma.media.updateMany({
        where: { id: { in: ids } },
        data: { folder },
      });

      return NextResponse.json({ success: true, updatedCount: updated.count });
    }

    return NextResponse.json({ success: false, error: "Invalid action specified" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error performing bulk action";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
