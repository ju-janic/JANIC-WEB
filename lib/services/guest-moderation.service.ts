import type { GuestApprovalMode } from "@prisma/client";
import { GuestRegistrationRepository } from "@/lib/repositories/guest-registration.repository";
import { GuestEmailService, type GuestEmailContext } from "@/lib/services/guest-email.service";
import { formatEventDate, formatEventTime, formatEventVenue } from "@/lib/guests/format";

/**
 * Orchestrates guest moderation: it ties the transactional approve/reject
 * actions to the notification emails and the automatic/manual processing mode.
 *
 * The repository owns the data changes; this service owns the workflow.
 */

type AdminGuestRecord = NonNullable<
  Awaited<ReturnType<typeof GuestRegistrationRepository.findByIdForAdmin>>
>;

export interface ActorInfo {
  id: string | null;
  label: string | null;
}

export type ApproveAction =
  | { ok: true; guestId: string; alreadyApproved: boolean; message: string }
  | { ok: false; code: "NOT_FOUND" | "DELETED" | "ERROR"; message: string; status: number };

export type RejectAction =
  | { ok: true; message: string }
  | { ok: false; code: "NOT_FOUND" | "DELETED" | "ERROR"; message: string; status: number };

export class GuestModerationService {
  private static contextFrom(record: AdminGuestRecord, guestId: string | null): GuestEmailContext {
    const config = record.eventConfig;
    return {
      registrationId: record.id,
      fullName: record.fullName,
      email: record.email,
      organization: record.organization,
      phone: record.phone,
      registrationRef: record.registrationRef,
      guestId: guestId ?? record.guestId,
      eventName: config.eventName,
      eventDateLabel: formatEventDate(config) ?? "To be confirmed",
      eventTimeLabel: formatEventTime(config),
      venueLabel: formatEventVenue(config),
      contactEmail: config.contactEmail,
      contactPhone: config.contactPhone,
    };
  }

  /** Approves a registration and emails the guest their invitation. */
  static async approve(args: {
    id: string;
    actor: ActorInfo;
    ipAddress?: string | null;
  }): Promise<ApproveAction> {
    const result = await GuestRegistrationRepository.approve(args.id, {
      actorId: args.actor.id,
      actorLabel: args.actor.label,
      ipAddress: args.ipAddress ?? null,
    });

    if (!result.ok) {
      return result.reason === "NOT_FOUND"
        ? { ok: false, code: "NOT_FOUND", message: "This registration no longer exists.", status: 404 }
        : { ok: false, code: "DELETED", message: "This registration has been deleted.", status: 410 };
    }

    if (!result.alreadyApproved) {
      const record = await GuestRegistrationRepository.findByIdForAdmin(args.id);
      if (record) {
        await GuestEmailService.sendApproval(
          this.contextFrom(record, result.guestId),
          "APPROVAL"
        );
      }
    }

    return {
      ok: true,
      guestId: result.guestId,
      alreadyApproved: result.alreadyApproved,
      message: result.alreadyApproved
        ? `Already approved as ${result.guestId}.`
        : `Approved. Guest ID ${result.guestId} and invitation issued.`,
    };
  }

  /** Rejects a registration and notifies the applicant. */
  static async reject(args: {
    id: string;
    actor: ActorInfo;
    reason?: string | null;
    ipAddress?: string | null;
  }): Promise<RejectAction> {
    const result = await GuestRegistrationRepository.reject(args.id, {
      actorId: args.actor.id,
      actorLabel: args.actor.label,
      ipAddress: args.ipAddress ?? null,
      reason: args.reason ?? null,
    });

    if (!result.ok) {
      return result.reason === "NOT_FOUND"
        ? { ok: false, code: "NOT_FOUND", message: "This registration no longer exists.", status: 404 }
        : { ok: false, code: "DELETED", message: "This registration has been deleted.", status: 410 };
    }

    const record = await GuestRegistrationRepository.findByIdForAdmin(args.id);
    if (record) {
      await GuestEmailService.sendRejection({
        ...this.contextFrom(record, null),
        rejectionReason: args.reason ?? null,
      });
    }

    return { ok: true, message: "Registration rejected and the applicant notified." };
  }

  /** Persists the manual/automatic processing mode for an event. */
  static async setAutomation(args: {
    eventConfigId: string;
    automatic: boolean;
    actor: ActorInfo;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<{ enabled: boolean; approvalMode: GuestApprovalMode } | null> {
    const approvalMode: GuestApprovalMode = args.automatic ? "AUTOMATIC" : "MANUAL";
    const updated = await GuestRegistrationRepository.updateAutomation({
      eventConfigId: args.eventConfigId,
      enabled: args.automatic,
      approvalMode,
      actorId: args.actor.id,
      actorLabel: args.actor.label,
      ipAddress: args.ipAddress ?? null,
      userAgent: args.userAgent ?? null,
    });
    if (!updated) return null;
    return { enabled: updated.automationEnabled, approvalMode: updated.approvalMode };
  }

  /** Applies automation rules to a freshly submitted registration. */
  private static async applyAutomation(record: AdminGuestRecord): Promise<boolean> {
    const config = record.eventConfig;
    if (!config.automationEnabled || config.approvalMode === "MANUAL") return false;
    if (record.status !== "PENDING") return false;

    const result = await GuestRegistrationRepository.approve(record.id, {
      actorId: null,
      actorLabel: "Automatic approval",
      ipAddress: null,
    });

    if (result.ok && !result.alreadyApproved) {
      await GuestEmailService.sendApproval(
        this.contextFrom(record, result.guestId),
        "AUTOMATED_APPROVAL"
      );
      await GuestRegistrationRepository.logActivity({
        registrationId: record.id,
        actorLabel: "Automatic approval",
        action: "AUTO_APPROVED",
        details: { guestId: result.guestId, approvalMode: config.approvalMode },
      });
      return true;
    }

    return false;
  }

  /** Re-evaluates a single registration against the automation rules. */
  static async runAutomation(registrationId: string): Promise<{ autoApproved: boolean }> {
    const record = await GuestRegistrationRepository.findByIdForAdmin(registrationId);
    if (!record) return { autoApproved: false };
    return { autoApproved: await this.applyAutomation(record) };
  }

  /**
   * Called right after a registration is persisted: sends the "received"
   * acknowledgement and, when the event runs in automatic mode, approves the
   * guest immediately.
   */
  static async afterRegistration(registrationId: string): Promise<void> {
    const record = await GuestRegistrationRepository.findByIdForAdmin(registrationId);
    if (!record) return;
    await GuestEmailService.sendRegistrationReceived(this.contextFrom(record, null));
    await this.applyAutomation(record);
  }
}
