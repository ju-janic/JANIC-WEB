import { Prisma } from "@prisma/client";
import type {
  GuestApprovalMode,
  GuestEmailStatus,
  GuestEmailType,
  GuestRegistration,
  GuestRegistrationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { GUEST_ID_COUNTER_KEY, GUEST_REGISTRATION_COUNTER_KEY } from "@/lib/guests/constants";
import { generateQrToken } from "@/lib/guests/qr";
import { normalizeEmail, normalizePhone, type GuestRegistrationInput } from "@/lib/guests/validation";

const MAX_ATTEMPTS = 5;

export class DuplicateGuestRegistrationError extends Error {
  constructor(public readonly field: "email" | "phone" | "user" | "unknown") {
    super("A registration with these details already exists");
    this.name = "DuplicateGuestRegistrationError";
  }
}

/** Thrown when a signed-in user already has a registration for the event. */
export class AlreadyRegisteredError extends Error {
  constructor() {
    super("This account has already registered for this event");
    this.name = "AlreadyRegisteredError";
  }
}

export interface CreateGuestRegistrationArgs {
  eventConfigId: string;
  registrationPrefix: string;
  userId: string | null;
  data: GuestRegistrationInput;
  approvalModeAtSubmit: GuestApprovalMode;
  configVersionAtSubmit: number;
  appliedRulesVersion: number;
  ipAddress: string | null;
  userAgent: string | null;
}

/** Provenance for any administrative moderation action. */
export interface ModerationMeta {
  actorId: string | null;
  actorLabel: string | null;
  ipAddress?: string | null;
}

export interface IssuedInvitation {
  id: string;
  qrToken: string;
  invitationNumber: string | null;
}

export type ApproveResult =
  | {
      ok: true;
      alreadyApproved: boolean;
      registration: GuestRegistration;
      guestId: string;
      invitation: IssuedInvitation;
    }
  | { ok: false; reason: "NOT_FOUND" | "DELETED" };

export type RejectResult =
  | { ok: true; registration: GuestRegistration }
  | { ok: false; reason: "NOT_FOUND" | "DELETED" };

function isKnownPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function duplicateFieldFromMeta(meta: unknown): "email" | "phone" | "user" | "unknown" {
  const target = String((meta as { target?: unknown } | undefined)?.target ?? "").toLowerCase();
  if (target.includes("email")) return "email";
  if (target.includes("phone")) return "phone";
  if (target.includes("userid")) return "user";
  return "unknown";
}

export class GuestRegistrationRepository {
  /**
   * Allocates the next human-readable registration reference.
   * Must be called inside the same transaction that inserts the registration.
   */
  private static async nextSequence(
    tx: Prisma.TransactionClient,
    eventConfigId: string,
    registrationPrefix: string
  ): Promise<number> {
    const counter = await tx.guestCounter.findUnique({
      where: {
        eventConfigId_key: {
          eventConfigId,
          key: GUEST_REGISTRATION_COUNTER_KEY,
        },
      },
    });

    if (counter) {
      const updated = await tx.guestCounter.update({
        where: { id: counter.id },
        data: { value: { increment: 1 } },
      });
      return updated.value;
    }

    // First registration for this event: continue after any pre-existing
    // references instead of restarting at 1.
    const latest = await tx.guestRegistration.findFirst({
      where: {
        eventConfigId,
        registrationRef: { startsWith: `${registrationPrefix}-` },
      },
      orderBy: { registrationRef: "desc" },
      select: { registrationRef: true },
    });

    const lastValue = latest
      ? Number.parseInt(latest.registrationRef.slice(registrationPrefix.length + 1), 10)
      : 0;

    const created = await tx.guestCounter.create({
      data: {
        eventConfigId,
        key: GUEST_REGISTRATION_COUNTER_KEY,
        value: Number.isFinite(lastValue) ? lastValue + 1 : 1,
      },
    });
    return created.value;
  }

  static async create(args: CreateGuestRegistrationArgs): Promise<GuestRegistration> {
    const { data } = args;
    const emailNormalized = normalizeEmail(data.email);
    const phoneNormalized = normalizePhone(data.phone);
    const accessibilityDetails = data.hasAccessibilityNeeds
      ? data.accessibilityDetails?.trim() || null
      : null;
    const additionalComments = data.additionalComments?.trim() || null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const clash = await tx.guestRegistration.findFirst({
            where: {
              eventConfigId: args.eventConfigId,
              OR: [{ emailNormalized }, { phoneNormalized }],
            },
            select: { emailNormalized: true, phoneNormalized: true },
          });

          if (clash) {
            throw new DuplicateGuestRegistrationError(
              clash.emailNormalized === emailNormalized ? "email" : "phone"
            );
          }

          // One registration per signed-in user per event.
          if (args.userId) {
            const existingForUser = await tx.guestRegistration.findFirst({
              where: { eventConfigId: args.eventConfigId, userId: args.userId },
              select: { id: true },
            });
            if (existingForUser) throw new AlreadyRegisteredError();
          }

          const sequence = await this.nextSequence(
            tx,
            args.eventConfigId,
            args.registrationPrefix
          );
          const registrationRef = `${args.registrationPrefix}-${String(sequence).padStart(4, "0")}`;

          const registration = await tx.guestRegistration.create({
            data: {
              registrationRef,
              eventConfigId: args.eventConfigId,
              userId: args.userId,
              status: "PENDING",
              fullName: data.fullName.trim(),
              organization: data.organization.trim(),
              position: data.position.trim(),
              email: data.email.trim(),
              emailNormalized,
              phone: data.phone.trim(),
              phoneNormalized,
              stakeholderCategory: data.stakeholderCategory,
              attendanceIntent: data.attendanceIntent,
              companionCount: data.companionCount,
              areasOfInterest: data.areasOfInterest,
              hasAccessibilityNeeds: data.hasAccessibilityNeeds,
              accessibilityDetails,
              mediaConsent: data.mediaConsent,
              referralSource: data.referralSource,
              additionalComments,
              accuracyConfirmed: data.accuracyConfirmed,
              privacyConsent: data.privacyConsent,
              approvalModeAtSubmit: args.approvalModeAtSubmit,
              configVersionAtSubmit: args.configVersionAtSubmit,
              appliedRulesVersion: args.appliedRulesVersion,
              eligibilityVerdict: "NOT_EVALUATED",
              source: "web",
              ipAddress: args.ipAddress,
              userAgent: args.userAgent,
            },
          });

          await tx.guestActivityLog.create({
            data: {
              registrationId: registration.id,
              actorLabel: registration.fullName,
              action: "REGISTRATION_SUBMITTED",
              details: {
                registrationRef,
                status: "PENDING",
                approvalMode: args.approvalModeAtSubmit,
                configVersion: args.configVersionAtSubmit,
              },
              ipAddress: args.ipAddress,
            },
          });

          return registration;
        });
      } catch (error) {
        if (error instanceof DuplicateGuestRegistrationError) throw error;

        if (isKnownPrismaError(error)) {
          // Unique constraint: another request claimed the email, phone,
          // reference or counter row first.
          if (error.code === "P2002") {
            if (attempt === MAX_ATTEMPTS) {
              throw new DuplicateGuestRegistrationError(duplicateFieldFromMeta(error.meta));
            }
            continue;
          }

          // Deadlock / write conflict under concurrent submissions.
          if (error.code === "P2034" && attempt < MAX_ATTEMPTS) continue;
        }

        throw error;
      }
    }

    throw new DuplicateGuestRegistrationError("unknown");
  }

  static async countRecentByIp(ipAddress: string, since: Date): Promise<number> {
    return prisma.guestRegistration.count({
      where: { ipAddress, submittedAt: { gte: since } },
    });
  }

  /**
   * Allocates the next sequential guest ID (e.g. JANIC-2026-0001).
   * Runs inside the approval transaction so two approvals can never share an ID.
   */
  private static async allocateGuestId(
    tx: Prisma.TransactionClient,
    eventConfigId: string,
    guestIdPrefix: string
  ): Promise<string> {
    const counter = await tx.guestCounter.findUnique({
      where: { eventConfigId_key: { eventConfigId, key: GUEST_ID_COUNTER_KEY } },
    });

    let value: number;
    if (counter) {
      value = (
        await tx.guestCounter.update({
          where: { id: counter.id },
          data: { value: { increment: 1 } },
        })
      ).value;
    } else {
      const latest = await tx.guestRegistration.findFirst({
        where: { eventConfigId, guestId: { startsWith: `${guestIdPrefix}-` } },
        orderBy: { guestId: "desc" },
        select: { guestId: true },
      });
      const lastValue = latest?.guestId
        ? Number.parseInt(latest.guestId.slice(guestIdPrefix.length + 1), 10)
        : 0;
      value = (
        await tx.guestCounter.create({
          data: {
            eventConfigId,
            key: GUEST_ID_COUNTER_KEY,
            value: Number.isFinite(lastValue) ? lastValue + 1 : 1,
          },
        })
      ).value;
    }

    return `${guestIdPrefix}-${String(value).padStart(4, "0")}`;
  }

  /**
   * Approves a registration: assigns a unique guest ID, issues (or re-issues)
   * the digital invitation with its secure QR token, and records the activity.
   * Idempotent — re-approving an already-approved guest never mints a second
   * guest ID, invitation or QR token.
   */
  static async approve(id: string, meta: ModerationMeta): Promise<ApproveResult> {
    return prisma.$transaction(async (tx) => {
      const reg = await tx.guestRegistration.findUnique({
        where: { id },
        include: { eventConfig: true, invitations: true },
      });
      if (!reg) return { ok: false as const, reason: "NOT_FOUND" as const };
      if (reg.deletedAt) return { ok: false as const, reason: "DELETED" as const };

      let invitation = reg.invitations[0] ?? null;
      if (reg.status === "APPROVED" && reg.guestId && invitation?.status === "ISSUED") {
        return {
          ok: true as const,
          alreadyApproved: true,
          registration: reg,
          guestId: reg.guestId,
          invitation: {
            id: invitation.id,
            qrToken: invitation.qrToken,
            invitationNumber: invitation.invitationNumber,
          },
        };
      }

      let guestId = reg.guestId;
      if (!guestId) {
        const prefix =
          reg.eventConfig.guestIdPrefix?.trim() || `JANIC-${new Date().getUTCFullYear()}`;
        guestId = await this.allocateGuestId(tx, reg.eventConfigId, prefix);
      }

      const updated = await tx.guestRegistration.update({
        where: { id },
        data: {
          status: "APPROVED",
          guestId,
          reviewedAt: new Date(),
          reviewedBy: meta.actorLabel ?? meta.actorId ?? null,
          rejectionReason: null,
          eligibilityVerdict:
            reg.eligibilityVerdict && reg.eligibilityVerdict !== "NOT_EVALUATED"
              ? reg.eligibilityVerdict
              : "MANUAL_APPROVED",
        },
      });

      if (!invitation) {
        invitation = await tx.guestInvitation.create({
          data: {
            registrationId: id,
            invitationNumber: guestId,
            qrToken: generateQrToken(),
            status: "ISSUED",
            issuedAt: new Date(),
            eventSnapshot: {
              eventName: reg.eventConfig.eventName,
              eventDate: reg.eventConfig.eventDate?.toISOString() ?? null,
              startTime: reg.eventConfig.startTime,
              endTime: reg.eventConfig.endTime,
              timezone: reg.eventConfig.timezone,
              venue: reg.eventConfig.venue,
              location: reg.eventConfig.location,
            },
          },
        });
      } else if (invitation.status !== "ISSUED") {
        invitation = await tx.guestInvitation.update({
          where: { id: invitation.id },
          data: {
            status: "ISSUED",
            issuedAt: new Date(),
            revokedAt: null,
            invitationNumber: invitation.invitationNumber ?? guestId,
          },
        });
      }

      await tx.guestActivityLog.create({
        data: {
          registrationId: id,
          actorId: meta.actorId,
          actorLabel: meta.actorLabel,
          action: "APPROVED",
          details: { guestId, invitationNumber: invitation.invitationNumber },
          ipAddress: meta.ipAddress ?? null,
        },
      });

      return {
        ok: true as const,
        alreadyApproved: false,
        registration: updated,
        guestId,
        invitation: {
          id: invitation.id,
          qrToken: invitation.qrToken,
          invitationNumber: invitation.invitationNumber,
        },
      };
    });
  }

  /** Rejects a registration, revokes any issued invitation and logs the reason. */
  static async reject(
    id: string,
    meta: ModerationMeta & { reason?: string | null }
  ): Promise<RejectResult> {
    const reason = meta.reason?.trim() || null;

    return prisma.$transaction(async (tx) => {
      const reg = await tx.guestRegistration.findUnique({
        where: { id },
        include: { invitations: true },
      });
      if (!reg) return { ok: false as const, reason: "NOT_FOUND" as const };
      if (reg.deletedAt) return { ok: false as const, reason: "DELETED" as const };

      const updated = await tx.guestRegistration.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          reviewedAt: new Date(),
          reviewedBy: meta.actorLabel ?? meta.actorId ?? null,
        },
      });

      if (reg.invitations.some((invite) => invite.status === "ISSUED")) {
        await tx.guestInvitation.updateMany({
          where: { registrationId: id, status: "ISSUED" },
          data: { status: "REVOKED", revokedAt: new Date() },
        });
      }

      await tx.guestActivityLog.create({
        data: {
          registrationId: id,
          actorId: meta.actorId,
          actorLabel: meta.actorLabel,
          action: "REJECTED",
          details: { reason },
          ipAddress: meta.ipAddress ?? null,
        },
      });

      return { ok: true as const, registration: updated };
    });
  }

  /** Persists the manual/automatic approval mode with an immutable audit entry. */
  static async updateAutomation(args: {
    eventConfigId: string;
    enabled: boolean;
    approvalMode: GuestApprovalMode;
    actorId: string | null;
    actorLabel: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.guestEventConfig.findUnique({ where: { id: args.eventConfigId } });
      if (!before) return null;

      const updated = await tx.guestEventConfig.update({
        where: { id: args.eventConfigId },
        data: {
          automationEnabled: args.enabled,
          approvalMode: args.approvalMode,
          version: { increment: 1 },
        },
      });

      await tx.guestConfigAudit.create({
        data: {
          eventConfigId: args.eventConfigId,
          actorId: args.actorId,
          actorLabel: args.actorLabel,
          action: "AUTOMATION_TOGGLE",
          changedKeys: ["automationEnabled", "approvalMode"],
          before: {
            automationEnabled: before.automationEnabled,
            approvalMode: before.approvalMode,
          },
          after: {
            automationEnabled: updated.automationEnabled,
            approvalMode: updated.approvalMode,
          },
          fromVersion: before.version,
          toVersion: updated.version,
          ipAddress: args.ipAddress ?? null,
          userAgent: args.userAgent ?? null,
        },
      });

      return updated;
    });
  }

  /** Opens an email delivery log row (PENDING) before the send is attempted. */
  static async logEmailStart(args: {
    registrationId: string;
    type: GuestEmailType;
    recipient: string;
  }) {
    return prisma.guestEmailLog.create({
      data: { ...args, status: "PENDING" },
    });
  }

  /** Settles an email delivery log row with the final outcome. */
  static async logEmailResult(
    id: string,
    status: GuestEmailStatus,
    result: { messageId?: string | null; error?: string | null }
  ) {
    return prisma.guestEmailLog.update({
      where: { id },
      data: {
        status,
        sentAt: status === "SENT" ? new Date() : null,
        messageId: result.messageId ?? null,
        error: result.error ?? null,
      },
    });
  }

  /** Marks an activity log entry for automated processing decisions. */
  static async logActivity(args: {
    registrationId: string | null;
    actorId?: string | null;
    actorLabel?: string | null;
    action: string;
    details?: Prisma.InputJsonValue;
    ipAddress?: string | null;
  }) {
    return prisma.guestActivityLog.create({
      data: {
        registrationId: args.registrationId,
        actorId: args.actorId ?? null,
        actorLabel: args.actorLabel ?? null,
        action: args.action,
        details: args.details,
        ipAddress: args.ipAddress ?? null,
      },
    });
  }

  static async findByReference(registrationRef: string) {
    return prisma.guestRegistration.findUnique({
      where: { registrationRef },
      include: { eventConfig: true },
    });
  }

  /** Resolves a scanned QR token to its invitation + registration record. */
  static async findByQrToken(qrToken: string) {
    return prisma.guestInvitation.findUnique({
      where: { qrToken },
      include: {
        registration: {
          include: {
            eventConfig: true,
            checkIns: true,
          },
        },
      },
    });
  }

  /** One user can only hold a single registration per event. */
  static async findByUserAndEventConfig(userId: string, eventConfigId: string) {
    return prisma.guestRegistration.findFirst({
      where: { userId, eventConfigId, deletedAt: null },
      include: { eventConfig: true },
    });
  }

  static async findById(id: string) {
    return prisma.guestRegistration.findUnique({
      where: { id },
      include: { eventConfig: true },
    });
  }

  /** Feeds the future "My Event Registration" profile section. */
  static async listForUser(userId: string) {
    return prisma.guestRegistration.findMany({
      where: { userId, deletedAt: null },
      orderBy: { submittedAt: "desc" },
      include: {
        eventConfig: {
          select: {
            eventName: true,
            slug: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venue: true,
            location: true,
            timezone: true,
          },
        },
      },
    });
  }

  /** Read-only admin listing. Phase 2 will add moderation actions on top. */
  static async listForAdmin(options?: {
    search?: string;
    status?: GuestRegistrationStatus;
    take?: number;
  }) {
    const where: Prisma.GuestRegistrationWhereInput = { deletedAt: null };

    if (options?.status) where.status = options.status;

    const search = options?.search?.trim();
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { organization: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { registrationRef: { contains: search } },
      ];
    }

    return prisma.guestRegistration.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      take: options?.take ?? 200,
      include: {
        eventConfig: {
          select: {
            eventName: true,
            slug: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venue: true,
            location: true,
            timezone: true,
          },
        },
      },
    });
  }

  static async findByIdForAdmin(id: string) {
    return prisma.guestRegistration.findUnique({
      where: { id },
      include: {
        eventConfig: {
          select: {
            eventName: true,
            slug: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venue: true,
            location: true,
            timezone: true,
            contactEmail: true,
            contactPhone: true,
            approvalMode: true,
            automationEnabled: true,
            rulesVersion: true,
            version: true,
          },
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        emailLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        invitations: true,
        checkIns: true,
      },
    });
  }

  static async statsForAdmin() {
    const base = { deletedAt: null } as const;
    const [total, pending, approved, rejected, waitlisted, checkedIn] = await Promise.all([
      prisma.guestRegistration.count({ where: base }),
      prisma.guestRegistration.count({ where: { ...base, status: "PENDING" } }),
      prisma.guestRegistration.count({ where: { ...base, status: "APPROVED" } }),
      prisma.guestRegistration.count({ where: { ...base, status: "REJECTED" } }),
      prisma.guestRegistration.count({ where: { ...base, status: "WAITLISTED" } }),
      prisma.guestCheckIn.count(),
    ]);
    return { total, pending, approved, rejected, waitlisted, checkedIn };
  }

  static async countForEvent(eventConfigId: string) {
    return prisma.guestRegistration.count({
      where: { eventConfigId, deletedAt: null },
    });
  }

  /** Event configurations shown in the admin approval-flow control. */
  static async listConfigsForAdmin() {
    return prisma.guestEventConfig.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        eventName: true,
        slug: true,
        automationEnabled: true,
        approvalMode: true,
        isActive: true,
        capacity: true,
        registrationClosesAt: true,
        waitingListEnabled: true,
      },
    });
  }

  static async findConfigById(eventConfigId: string) {
    return prisma.guestEventConfig.findUnique({
      where: { id: eventConfigId },
      select: {
        id: true,
        eventName: true,
        slug: true,
        automationEnabled: true,
        approvalMode: true,
      },
    });
  }

  /**
   * Closes or reopens the guest registration link for an event config.
   * Closing sets `isActive = false` (public submissions then receive the
   * INACTIVE closed reason); reopening clears the registration window so the
   * event becomes open again. Every change is written to the activity log.
   */
  static async updateRegistrationState(args: {
    eventConfigId: string;
    isActive: boolean;
    registrationClosesAt?: Date | null;
    capacity?: number | null;
    actorId: string | null;
    actorLabel: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.guestEventConfig.findUnique({
        where: { id: args.eventConfigId },
      });
      if (!before) return null;

      const updated = await tx.guestEventConfig.update({
        where: { id: args.eventConfigId },
        data: {
          isActive: args.isActive,
          registrationClosesAt:
            args.registrationClosesAt !== undefined
              ? args.registrationClosesAt
              : before.registrationClosesAt,
          capacity: args.capacity !== undefined ? args.capacity : before.capacity,
        },
      });

      await tx.guestActivityLog.create({
        data: {
          registrationId: null,
          actorId: args.actorId,
          actorLabel: args.actorLabel,
          action: args.isActive ? "REGISTRATION_REOPENED" : "REGISTRATION_CLOSED",
          details: {
            eventConfigId: args.eventConfigId,
            eventName: updated.eventName,
            isActive: updated.isActive,
            registrationClosesAt: updated.registrationClosesAt,
            capacity: updated.capacity,
          },
          ipAddress: args.ipAddress ?? null,
        },
      });

      return updated;
    });
  }

  /** Number of approved guests currently occupying the event capacity. */
  static async countApprovedForEvent(eventConfigId: string): Promise<number> {
    return prisma.guestRegistration.count({
      where: { eventConfigId, deletedAt: null, status: "APPROVED" },
    });
  }
}
