import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { SponsorService } from "@/services/sponsors/sponsor.service";

const MAX_PROPOSAL_BYTES = 1024 * 1024 * 1024; // 1 GB
const sponsorshipSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  organizationType: z.string().min(2, "Organization type is required"),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  whatTheySponsor: z.string().min(2, "Please select what you would like to sponsor"),
  sponsorshipType: z.string().min(2, "Sponsorship type is required"),
  sponsorshipLevel: z.string().min(2, "Sponsorship level is required"),
  estimatedAmount: z.string().min(1, "Estimated sponsorship amount is required"),
  description: z.string().min(10, "Please provide a short sponsorship description"),
  proposalUrl: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, unknown>;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const proposalFile = formData.get("proposal") instanceof File ? (formData.get("proposal") as File) : null;

      if (proposalFile) {
        if (proposalFile.size > MAX_PROPOSAL_BYTES) {
          return NextResponse.json(
            { success: false, error: "FILE_TOO_LARGE", message: "Sponsorship proposal exceeds 1 GB." },
            { status: 413 }
          );
        }
        const bytes = await proposalFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeName = proposalFile.name.replace(/[^\w.-]/g, "_");
        const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeName}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        await fs.promises.writeFile(path.join(uploadDir, uniqueFileName), buffer);
        body = {
          organizationName: String(formData.get("organizationName") ?? ""),
          organizationType: String(formData.get("organizationType") ?? ""),
          contactName: String(formData.get("contactName") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: formData.get("phone") ? String(formData.get("phone")) : null,
          website: formData.get("website") ? String(formData.get("website")) : null,
          whatTheySponsor: String(formData.get("whatTheySponsor") ?? ""),
          sponsorshipType: String(formData.get("sponsorshipType") ?? ""),
          sponsorshipLevel: String(formData.get("sponsorshipLevel") ?? ""),
          estimatedAmount: String(formData.get("estimatedAmount") ?? ""),
          description: String(formData.get("description") ?? ""),
          proposalUrl: proposalFile ? `/uploads/${uniqueFileName}` : String(formData.get("proposalUrl") ?? "") || null,
        };
      } else {
        body = {
          organizationName: String(formData.get("organizationName") ?? ""),
          organizationType: String(formData.get("organizationType") ?? ""),
          contactName: String(formData.get("contactName") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: formData.get("phone") ? String(formData.get("phone")) : null,
          website: formData.get("website") ? String(formData.get("website")) : null,
          whatTheySponsor: String(formData.get("whatTheySponsor") ?? ""),
          sponsorshipType: String(formData.get("sponsorshipType") ?? ""),
          sponsorshipLevel: String(formData.get("sponsorshipLevel") ?? ""),
          estimatedAmount: String(formData.get("estimatedAmount") ?? ""),
          description: String(formData.get("description") ?? ""),
          proposalUrl: formData.get("proposalUrl") ? String(formData.get("proposalUrl")) : null,
        };
      }
    } else {
      body = await req.json();
    }

    const parsed = sponsorshipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const sponsor = await SponsorService.submitSponsorship({
      organizationName: parsed.data.organizationName.trim(),
      organizationType: parsed.data.organizationType.trim(),
      contactName: parsed.data.contactName.trim(),
      email: parsed.data.email.trim(),
      phone: parsed.data.phone?.trim() || null,
      website: parsed.data.website?.trim() || null,
      whatTheySponsor: parsed.data.whatTheySponsor.trim(),
      sponsorshipType: parsed.data.sponsorshipType.trim(),
      sponsorshipLevel: parsed.data.sponsorshipLevel.trim(),
      estimatedAmount: parsed.data.estimatedAmount.trim(),
      description: parsed.data.description.trim(),
      proposalUrl: parsed.data.proposalUrl?.trim() || null,
      logoUrl: null,
    });

    revalidatePath("/sponsors");

    return NextResponse.json({
      success: true,
      message: "Sponsorship proposal submitted successfully",
      sponsorId: sponsor.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
