/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TeamRepository } from "@/repositories/team.repository";
import { requireAuth } from "@/lib/permissions/roles";
import { revalidatePath } from "next/cache";

const emptyToNull = (v: unknown) => {
  if (typeof v === "string") {
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return v ?? null;
};

const teamSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
  department: z.string().default("Faculty of Computer Science & IT"),
  bio: z.string().optional().nullable().transform(emptyToNull),
  avatar: z.string().optional().nullable().transform(emptyToNull),
  email: z.string().optional().nullable().transform(emptyToNull),
  linkedin: z.string().optional().nullable().transform(emptyToNull),
  order: z.number().default(0),
  isFounder: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const items = await TeamRepository.findAllAdmin();
    return NextResponse.json({ success: true, items });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(null, "team:update");
    const body = await req.json();
    const parsed = teamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const item = await TeamRepository.create(parsed.data as any);
    revalidatePath("/about");
    return NextResponse.json({ success: true, item });
  } catch (err: unknown) {
    console.error("POST /api/team error:", err);
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
