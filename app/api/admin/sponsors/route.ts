import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/permissions/roles";
import { SponsorService } from "@/services/sponsors/sponsor.service";

const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth(null, "partnerships:read");
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const parsed = listQuerySchema.safeParse({ search, status });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const sponsors = await SponsorService.getAllAdmin({
      search: parsed.data.search?.trim() || undefined,
      status: parsed.data.status?.trim() || undefined,
    });

    return NextResponse.json({ success: true, sponsors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

const createSchema = z.object({
  organizationName: z.string().min(2),
  organizationType: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  sponsorshipType: z.string().optional().nullable(),
  whatTheySponsor: z.string().optional().nullable(),
  sponsorshipLevel: z.string().optional().nullable(),
  estimatedAmount: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  proposalUrl: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  status: z.string().optional(),
  isApproved: z.boolean().optional(),
  isRejected: z.boolean().optional(),
  adminNotes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAuth(null, "partnerships:create");
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const sponsor = await SponsorService.submitSponsorship({
      organizationName: parsed.data.organizationName.trim(),
      organizationType: parsed.data.organizationType?.trim() || null,
      contactName: parsed.data.contactName?.trim() || null,
      email: parsed.data.email?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      website: parsed.data.website?.trim() || null,
      sponsorshipType: parsed.data.sponsorshipType?.trim() || null,
      whatTheySponsor: parsed.data.whatTheySponsor?.trim() || null,
      sponsorshipLevel: parsed.data.sponsorshipLevel?.trim() || null,
      estimatedAmount: parsed.data.estimatedAmount?.trim() || null,
      description: parsed.data.description?.trim() || null,
      proposalUrl: parsed.data.proposalUrl?.trim() || null,
      logoUrl: parsed.data.logoUrl?.trim() || null,
    });

    // Admin-created sponsor records are born as pending review unless an
    // explicit approval decision is supplied.
    if (parsed.data.isApproved || parsed.data.isRejected) {
      await SponsorService.update(sponsor.id, {
        isApproved: parsed.data.isApproved ?? false,
        isRejected: parsed.data.isRejected ?? false,
        status: parsed.data.isApproved ? "APPROVED" : "REJECTED",
      });
    }

    revalidatePath("/sponsors");

    return NextResponse.json({ success: true, item: sponsor }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
