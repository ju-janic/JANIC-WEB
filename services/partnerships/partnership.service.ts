import { PartnershipRepository } from "@/repositories/partnership.repository";

export class PartnershipService {
  static async submitInquiry(data: {
    organizationName: string;
    organizationType: string;
    contactName: string;
    email: string;
    phone?: string;
    collaborationArea: string;
    proposalDetails: string;
  }) {
    return PartnershipRepository.create({
      organizationName: data.organizationName,
      organizationType: data.organizationType,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      collaborationArea: data.collaborationArea,
      proposalDetails: data.proposalDetails,
      isApproved: false,
      isRejected: false,
      status: "NEW",
    });
  }

  static async getAllAdmin(options?: { search?: string }) {
    return PartnershipRepository.findAllAdmin(options);
  }

  static async getAllPublic() {
    return PartnershipRepository.findAllPublic();
  }

  /** Approved partnerships for the public partners showcase. */
  static async getApprovedPublic() {
    return PartnershipRepository.findApproved();
  }

  static async updateApproval(id: string, isApproved: boolean, isRejected: boolean, adminNotes?: string) {
    return PartnershipRepository.updateApproval(id, isApproved, isRejected, adminNotes);
  }

  static async updateInquiry(id: string, data: {
    organizationName?: string;
    organizationType?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    collaborationArea?: string;
    proposalDetails?: string;
    isApproved?: boolean;
    isRejected?: boolean;
    adminNotes?: string;
  }) {
    return PartnershipRepository.update(id, data);
  }

  static async deleteInquiry(id: string) {
    return PartnershipRepository.delete(id);
  }

  static async createByAdmin(data: {
    organizationName: string;
    organizationType: string;
    contactName: string;
    email: string;
    phone?: string;
    collaborationArea: string;
    proposalDetails: string;
    isApproved?: boolean;
    isRejected?: boolean;
    adminNotes?: string;
  }) {
    return PartnershipRepository.create({
      organizationName: data.organizationName,
      organizationType: data.organizationType,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      collaborationArea: data.collaborationArea,
      proposalDetails: data.proposalDetails,
      isApproved: data.isApproved ?? true,
      isRejected: data.isRejected ?? false,
      adminNotes: data.adminNotes,
    });
  }
}
