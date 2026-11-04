/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/db/prisma";

export class PartnershipRepository {
  static async create(data: any) {
    return (prisma.partnershipInquiry as any).create({ data });
  }

  static async findAllAdmin(options?: {
    status?: string;
    search?: string;
  }) {
    const where: any = {};
    if (options?.status) where.status = options.status;
    if (options?.search) {
      where.OR = [
        { organizationName: { contains: options.search } },
        { contactName: { contains: options.search } },
        { email: { contains: options.search } },
      ];
    }

    return (prisma.partnershipInquiry as any).findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateApproval(id: string, isApproved: boolean, isRejected: boolean, adminNotes?: string) {
    const status = isApproved ? "APPROVED" : isRejected ? "REJECTED" : "NEW";
    await prisma.$executeRawUnsafe(
      `UPDATE PartnershipInquiry SET status = ?, isApproved = ?, isRejected = ?, adminNotes = ?, updatedAt = NOW() WHERE id = ?`,
      status,
      isApproved ? 1 : 0,
      isRejected ? 1 : 0,
      adminNotes ?? null,
      id
    );
    return prisma.partnershipInquiry.findUnique({ where: { id } });
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
      values.push(data.phone ?? null);
    }
    if (data.collaborationArea !== undefined) {
      fields.push("collaborationArea = ?");
      values.push(data.collaborationArea);
    }
    if (data.proposalDetails !== undefined) {
      fields.push("proposalDetails = ?");
      values.push(data.proposalDetails);
    }
    if (data.logoUrl !== undefined) {
      fields.push("logoUrl = ?");
      values.push(data.logoUrl ?? null);
    }
    if (data.isApproved !== undefined || data.isRejected !== undefined) {
      const isApp = data.isApproved ?? false;
      const isRej = data.isRejected ?? false;
      const status = isApp ? "APPROVED" : isRej ? "REJECTED" : "NEW";
      fields.push("status = ?");
      values.push(status);
      fields.push("isApproved = ?");
      values.push(isApp ? 1 : 0);
      fields.push("isRejected = ?");
      values.push(isRej ? 1 : 0);
    }
    if (data.status !== undefined) {
      fields.push("status = ?");
      values.push(data.status);
    }
    if (data.adminNotes !== undefined) {
      fields.push("adminNotes = ?");
      values.push(data.adminNotes ?? null);
    }

    fields.push("updatedAt = NOW()");
    values.push(id);

    if (fields.length > 1) {
      const sql = `UPDATE PartnershipInquiry SET ${fields.join(", ")} WHERE id = ?`;
      await prisma.$executeRawUnsafe(sql, ...values);
    }

    return prisma.partnershipInquiry.findUnique({ where: { id } });
  }

  static async delete(id: string) {
    return (prisma.partnershipInquiry as any).delete({ where: { id } });
  }

  static async findAllPublic() {
    return (prisma.partnershipInquiry as any).findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /** Approved partnerships shown on the public partners showcase. */
  static async findApproved() {
    return (prisma.partnershipInquiry as any).findMany({
      where: { isApproved: true, isRejected: false },
      orderBy: { createdAt: "desc" },
    });
  }
}
