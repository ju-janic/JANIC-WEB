import { SponsorRepository, type SponsorInput } from "@/repositories/sponsor.repository";

export class SponsorService {
  static async submitSponsorship(data: SponsorInput) {
    const sponsor = await SponsorRepository.create({
      ...data,
      status: data.status ?? "PENDING",
      isApproved: data.isApproved ?? false,
      isRejected: data.isRejected ?? false,
    });

    return sponsor;
  }

  static async getApprovedSponsors(): Promise<any[]> {
    return SponsorRepository.findApproved();
  }

  static async getAllAdmin(options?: { search?: string; status?: string }): Promise<any[]> {
    return SponsorRepository.findAllAdmin(options);
  }

  static async getById(id: string): Promise<any | null> {
    return SponsorRepository.findById(id);
  }

  static async update(id: string, data: any): Promise<any | null> {
    return SponsorRepository.update(id, data);
  }

  static async delete(id: string): Promise<any> {
    return SponsorRepository.delete(id);
  }
}
