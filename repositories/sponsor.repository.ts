import prisma from "@/lib/db/prisma";

export interface SponsorInput {
  organizationName: string;
  organizationType?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  sponsorshipType?: string | null;
  whatTheySponsor?: string | null;
  sponsorshipLevel?: string | null;
  estimatedAmount?: string | null;
  description?: string | null;
  proposalUrl?: string | null;
  logoUrl?: string | null;
  status?: string;
  isApproved?: boolean;
  isRejected?: boolean;
}

export class SponsorRepository {
  static async create(data: SponsorInput) {
    return (prisma as any).sponsor.create({ data });
  }

  static async findAllAdmin(options?: { search?: string; status?: string }) {
    const where: any = {};
    if (options?.status) where.status = options.status;
    if (options?.search) {
      where.OR = [
        { organizationName: { contains: options.search } },
        { contactName: { contains: options.search } },
        { email: { contains: options.search } },
        { sponsorshipLevel: { contains: options.search } },
      ];
    }

    return (prisma as any).sponsor.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  static async findApproved() {
    return (prisma as any).sponsor.findMany({
      where: { isApproved: true, isRejected: false },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(id: string) {
    return (prisma as any).sponsor.findUnique({ where: { id } });
  }

  static async update(id: string, data: any) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.organizationName !== undefined) {
      fields.push("organizationName = ?");
      values.push(data.organizationName);
    }
    if (data.organizationType !== undefined) {
      fields.push("organizationType = ?");
      values.push(data.organizationType);
    }
    if (data.contactName !== undefined) {
      fields.push("contactName = ?");
      values.push(data.contactName);
    }
    if (data.email !== undefined) {
      fields.push("email = ?");
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      fields.push("phone = ?");
      values.push(data.phone);
    }
    if (data.website !== undefined) {
      fields.push("website = ?");
      values.push(data.website);
    }
    if (data.sponsorshipType !== undefined) {
      fields.push("sponsorshipType = ?");
      values.push(data.sponsorshipType);
    }
    if (data.whatTheySponsor !== undefined) {
      fields.push("whatTheySponsor = ?");
      values.push(data.whatTheySponsor);
    }
    if (data.sponsorshipLevel !== undefined) {
      fields.push("sponsorshipLevel = ?");
      values.push(data.sponsorshipLevel);
    }
    if (data.estimatedAmount !== undefined) {
      fields.push("estimatedAmount = ?");
      values.push(data.estimatedAmount);
    }
    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description);
    }
    if (data.proposalUrl !== undefined) {
      fields.push("proposalUrl = ?");
      values.push(data.proposalUrl);
    }
    if (data.logoUrl !== undefined) {
      fields.push("logoUrl = ?");
      values.push(data.logoUrl);
    }
    if (data.status !== undefined) {
      fields.push("status = ?");
      values.push(data.status);
    }
    if (data.isApproved !== undefined) {
      fields.push("isApproved = ?");
      values.push(data.isApproved ? 1 : 0);
    }
    if (data.isRejected !== undefined) {
      fields.push("isRejected = ?");
      values.push(data.isRejected ? 1 : 0);
    }
    if (data.adminNotes !== undefined) {
      fields.push("adminNotes = ?");
      values.push(data.adminNotes);
    }

    if (fields.length > 0) {
      fields.push("updatedAt = NOW()");
      values.push(id);
      const sql = `UPDATE Sponsor SET ${fields.join(", ")} WHERE id = ?`;
      await prisma.$executeRawUnsafe(sql, ...values);
    }

    return (prisma as any).sponsor.findUnique({ where: { id } });
  }

  static async delete(id: string) {
    return (prisma as any).sponsor.delete({ where: { id } });
  }
}
