import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/permissions/roles";
import fs from "fs";
import path from "path";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(null, "media:update");
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.media.update({
      where: { id },
      data: {
        alt: body.alt ?? undefined,
        folder: body.folder ?? undefined,
      },
    });
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
    await requireAuth(null, "media:update");
    const { id } = await params;

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await prisma.media.delete({ where: { id } });

    if (media.url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", media.url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // file already gone
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
