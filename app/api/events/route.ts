/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventService } from "@/services/events/event.service";
import { requireAuth } from "@/lib/permissions/roles";
import { ContentStatus } from "@prisma/client";

const eventSchema = z.object({
  title: z.string().min(2, "Title is required"),
  category: z.string().min(2, "Category is required"),
  summary: z.string().min(10, "Summary is required"),
  description: z.string().min(10, "Description is required"),
  eventDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  location: z.string().min(2, "Location is required"),
  isVirtual: z.boolean().default(false),
  registrationUrl: z.string().optional().nullable(),
  capacity: z.number().optional().nullable(),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  isFeatured: z.boolean().default(false),
  coverImage: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  attendeesCount: z.number().optional().nullable(),
  gallery: z.any().optional().nullable(),
  guests: z.any().optional().nullable(),
  agenda: z.any().optional().nullable(),
  keyHighlights: z.any().optional().nullable(),
});

export async function GET() {
  try {
    const items = await EventService.getAllAdmin();
    return NextResponse.json({ success: true, items });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(null, "events:update");
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const eventDate = new Date(parsed.data.eventDate as string);
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate as string) : undefined;

    const item = await EventService.createEvent({
      ...parsed.data,
      eventDate,
      endDate,
    } as any);

    return NextResponse.json({ success: true, item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
